/**
 * OCR API Route for Fuel Price Detection
 * 
 * This route handles image processing and OCR using Google Cloud Vision API
 * to extract fuel prices from images of gas station price signs.
 */

import { NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { writeFile } from 'fs/promises';
import { join, isAbsolute } from 'path';
import * as os from 'os';
import * as fs from 'fs';
import sharp from 'sharp'; // Image processing library

// Initialize Vision client with credentials
let client: ImageAnnotatorClient | null = null;

// Rate limiting configuration
let requestCounter = 0;
const MAX_REQUESTS_PER_MINUTE = 100; // API quota limit
let requestTimestamp = Date.now();

/**
 * Initializes the Google Cloud Vision client with proper credentials
 * @returns Promise<boolean> - Success status of initialization
 */
const initializeVisionClient = async () => {
  try {
    // First try environment variable path
    let credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
    
    // Convert relative path to absolute if needed
    if (!isAbsolute(credentialsPath)) {
      credentialsPath = join(process.cwd(), credentialsPath);
    }
    
    console.log('Checking credentials path:', credentialsPath);
    
    // Verify credentials file exists
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Credentials file not found at: ${credentialsPath}`);
    }

    // Validate credentials file format
    try {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      if (!credentials.project_id || !credentials.private_key) {
        throw new Error('Invalid credentials file format');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error parsing credentials';
      throw new Error(`Invalid credentials file: ${message}`);
    }
    
    // Initialize Vision client
    client = new ImageAnnotatorClient({
      keyFilename: credentialsPath
    });
    
    // Test client connection
    await client.initialize();
    console.log('Vision client initialized and tested successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Vision client:', error);
    return false;
  }
};

/**
 * Implements rate limiting for API requests
 * @returns boolean - Whether request is allowed
 */
function checkRateLimit() {
  const now = Date.now();
  
  // Reset counter if a minute has passed
  if (now - requestTimestamp > 60000) {
    requestCounter = 0;
    requestTimestamp = now;
    return true;
  }
  
  // Check if we're over the limit
  if (requestCounter >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  requestCounter++;
  return true;
}

/**
 * Preprocesses image to improve OCR accuracy
 * @param inputPath - Path to input image
 * @param outputPath - Path to save processed image
 * @returns Promise<boolean> - Success status of preprocessing
 */
async function preprocessImage(inputPath: string, outputPath: string) {
  try {
    await sharp(inputPath)
      // Enhance image for better text recognition
      .normalize() // Increase contrast
      .sharpen() // Make text clearer
      .median(1) // Reduce noise
      .modulate({ brightness: 1.1 }) // Adjust brightness
      .toFile(outputPath);
    
    return true;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    return false;
  }
}

/**
 * POST handler for OCR API endpoint
 * Processes image and extracts fuel prices
 */
export async function POST(request: Request) {
  console.log('OCR API endpoint called');
  
  try {
    // Check rate limit
    if (!checkRateLimit()) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      }, { status: 429 });
    }
    
    // Initialize client if needed
    if (!client) {
      const initialized = await initializeVisionClient();
      if (!initialized) {
        return NextResponse.json({
          success: false,
          error: 'Vision client initialization failed. Please check your Google Cloud credentials configuration.',
          details: `Required: A valid Google Cloud service account key file at ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`,
          setup: [
            '1. Create a Google Cloud project',
            '2. Enable the Coud Visilon API',
            '3. Create a service account and download the JSON key file',
            '4. Place the key file in config/keys/google-cloud-credentials.json',
            '5. Set GOOGLE_APPLICATION_CREDENTIALS in your .env file'
          ]
        }, { status: 500 });
      }
    }

    // Get image from form data
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      console.error('No image file provided in request');
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    console.log('Processing image:', {
      type: file.type,
      size: file.size,
      name: file.name
    });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to temporary files
    const originalFilePath = join(os.tmpdir(), `ocr-original-${Date.now()}.jpg`);
    const processedFilePath = join(os.tmpdir(), `ocr-processed-${Date.now()}.jpg`);
    console.log('Saving image to temp file:', originalFilePath);
    await writeFile(originalFilePath, buffer);
    
    // Preprocess image
    console.log('Preprocessing image to improve OCR quality...');
    const preprocessed = await preprocessImage(originalFilePath, processedFilePath);
    const fileToProcess = preprocessed ? processedFilePath : originalFilePath;

    // Perform OCR
    console.log('Starting OCR processing with Google Vision API...');
    const [result] = await client!.textDetection(fileToProcess);
    console.log('OCR processing completed');

    if (!result) {
      console.error('OCR processing failed - no result returned');
      return NextResponse.json({
        success: false,
        error: 'OCR processing failed - no result returned'
      });
    }

    const detections = result.textAnnotations;
    console.log('Text annotations found:', detections?.length || 0);

    if (!detections || detections.length === 0) {
      console.error('No text detected in image');
      return NextResponse.json({
        success: false,
        error: 'No text detected in image'
      });
    }

    let extractedText = detections[0].description || '';
    console.log('Raw extracted text:', extractedText);
    
    // Enhanced price extraction logic
    const lines = extractedText.split('\n');
    const fuelPrices: { type: string; price: string }[] = [];
    
    // Define fuel type keywords for classification
    const regularFuelKeywords = ['REGULAR', 'UNLEADED', 'PETROL', 'E10', 'ULP', 'STANDARD', '91', 'BASIC'];
    const premiumFuelKeywords = ['PREMIUM', 'PLUS', 'EXTRA', 'SUPREME', 'V-POWER', 'VPOWER', 'ULTIMATE', '95', '98'];
    const dieselKeywords = ['DIESEL', 'AUTO DIESEL', 'DERV', 'GASOIL', 'D'];
    const premiumDieselKeywords = [...dieselKeywords.map(k => `PREMIUM ${k}`), 'ULTIMATE DIESEL', 'V-POWER DIESEL', 'ADVANCED DIESEL'];
    
    // Process each line for price extraction
    lines.forEach(line => {
        // Clean and normalize line
        line = line.trim().toUpperCase().replace(/[^\w\s.-]/g, '');
        
        // Skip short lines
        if (line.length < 3) return;
        
        // Price pattern matching
        const pricePatterns = [
            /\$?(\d+\.\d+)/,         // Match $9.99 or 9.99
            /€?(\d+\.\d+)/,          // Match €9.99 or 9.99
            /(\d+\.\d+)/,            // Match any decimal number
            /(\d{2,3})/              // Match 2-3 digit numbers (like 199, 249)
        ];
        
        let price: number | null = null;
        let matchedPattern = false;
        
        // Try each price pattern
        for (const pattern of pricePatterns) {
            const match = line.match(pattern);
            if (match) {
                const extracted = parseFloat(match[1]);
                // Validate price range
                if (extracted > 0 && extracted < 1000) {
                    price = extracted;
                    matchedPattern = true;
                    break;
                }
            }
        }
        
        if (!price) return;
        
        // Convert cents to dollars/euros if needed
        if (price >= 100 && price < 1000 && !line.includes('.')) {
            price = price / 100;
        }
        
        // Determine fuel type
        let type = '';
        
        // Check fuel types in order of specificity
        if (premiumDieselKeywords.some(keyword => line.includes(keyword))) {
            type = 'diesel_premium';
        } 
        else if (dieselKeywords.some(keyword => line.includes(keyword))) {
            type = 'diesel';
        }
        else if (premiumFuelKeywords.some(keyword => line.includes(keyword))) {
            type = 'unleaded_premium';
        }
        else if (regularFuelKeywords.some(keyword => line.includes(keyword))) {
            type = 'unleaded';
        }
        // Fallback for unknown types with valid prices
        else if (price > 0.5 && price < 10) {
            type = 'unknown';
        }
        
        if (type) {
            fuelPrices.push({
                type,
                price: price.toString()
            });
        }
    });
    
    console.log('Extracted fuel prices:', fuelPrices);

    // Clean up temporary files
    try {
      await fs.promises.unlink(originalFilePath);
      if (preprocessed) {
        await fs.promises.unlink(processedFilePath);
      }
      console.log('Temporary files cleaned up');
    } catch (cleanupError) {
      console.error('Error cleaning up temp files:', cleanupError);
    }

    // Return results
    return NextResponse.json({
      success: true,
      text: extractedText,
      fuelPrices
    });

  } catch (error) {
    console.error('OCR processing error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 