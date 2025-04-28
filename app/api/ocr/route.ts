import { NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { writeFile } from 'fs/promises';
import { join, isAbsolute } from 'path';
import * as os from 'os';
import * as fs from 'fs';
import sharp from 'sharp'; // Fixing the sharp import

// Initialize Vision client with credentials
let client: ImageAnnotatorClient | null = null;

// Request counter for API limit monitoring
let requestCounter = 0;
const MAX_REQUESTS_PER_MINUTE = 100; // Adjust based on your API quota
let requestTimestamp = Date.now();

const initializeVisionClient = async () => {
  try {
    // First try environment variable path
    let credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
    
    // If it's a relative path, make it absolute
    if (!isAbsolute(credentialsPath)) {
      credentialsPath = join(process.cwd(), credentialsPath);
    }
    
    console.log('Checking credentials path:', credentialsPath);
    
    // Verify if the credentials file exists
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Credentials file not found at: ${credentialsPath}`);
    }

    // Try to read and parse the credentials file
    try {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      if (!credentials.project_id || !credentials.private_key) {
        throw new Error('Invalid credentials file format');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error parsing credentials';
      throw new Error(`Invalid credentials file: ${message}`);
    }
    
    client = new ImageAnnotatorClient({
      keyFilename: credentialsPath
    });
    
    // Test the client with a simple call
    await client.initialize();
    console.log('Vision client initialized and tested successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Vision client:', error);
    return false;
  }
};

// Function to check API rate limits
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

// Image preprocessing to improve OCR results
async function preprocessImage(inputPath: string, outputPath: string) {
  try {
    await sharp(inputPath)
      // Increase contrast to make text more visible
      .normalize()
      // Sharpen the image to make text clearer
      .sharpen()
      // Remove noise
      .median(1)
      // Increase brightness slightly
      .modulate({ brightness: 1.1 })
      // Save the processed image
      .toFile(outputPath);
    
    return true;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    return false;
  }
}

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
    
    // Try to initialize client if not already initialized
    if (!client) {
      const initialized = await initializeVisionClient();
      if (!initialized) {
        return NextResponse.json({
          success: false,
          error: 'Vision client initialization failed. Please check your Google Cloud credentials configuration.',
          details: `Required: A valid Google Cloud service account key file at ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`,
          setup: [
            '1. Create a Google Cloud project',
            '2. Enable the Cloud Vision API',
            '3. Create a service account and download the JSON key file',
            '4. Place the key file in config/keys/google-cloud-credentials.json',
            '5. Set GOOGLE_APPLICATION_CREDENTIALS in your .env file'
          ]
        }, { status: 500 });
      }
    }

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

    // Convert the file to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save original image to temp file
    const originalFilePath = join(os.tmpdir(), `ocr-original-${Date.now()}.jpg`);
    const processedFilePath = join(os.tmpdir(), `ocr-processed-${Date.now()}.jpg`);
    console.log('Saving image to temp file:', originalFilePath);
    await writeFile(originalFilePath, buffer);
    
    // Preprocess the image to improve OCR results
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
    
    // Enhanced price extraction logic with improved pattern matching
    const lines = extractedText.split('\n');
    const fuelPrices: { type: string; price: string }[] = [];
    
    // Common fuel type keywords and their variations
    const regularFuelKeywords = ['REGULAR', 'UNLEADED', 'PETROL', 'E10', 'ULP', 'STANDARD', '91', 'BASIC'];
    const premiumFuelKeywords = ['PREMIUM', 'PLUS', 'EXTRA', 'SUPREME', 'V-POWER', 'VPOWER', 'ULTIMATE', '95', '98'];
    const dieselKeywords = ['DIESEL', 'AUTO DIESEL', 'DERV', 'GASOIL', 'D'];
    const premiumDieselKeywords = [...dieselKeywords.map(k => `PREMIUM ${k}`), 'ULTIMATE DIESEL', 'V-POWER DIESEL', 'ADVANCED DIESEL'];
    
    lines.forEach(line => {
        // Clean up the line
        line = line.trim().toUpperCase().replace(/[^\w\s.-]/g, '');
        
        // Skip lines that are too short
        if (line.length < 3) return;
        
        // Extract price using more flexible regex patterns
        // Look for patterns like: $9.99, 9.99, €9.99, 999, etc.
        const pricePatterns = [
            /\$?(\d+\.\d+)/,         // Match $9.99 or 9.99
            /€?(\d+\.\d+)/,          // Match €9.99 or 9.99
            /(\d+\.\d+)/,            // Match any decimal number
            /(\d{2,3})/              // Match 2-3 digit numbers (like 199, 249)
        ];
        
        let price: number | null = null;
        let matchedPattern = false;
        
        for (const pattern of pricePatterns) {
            const match = line.match(pattern);
            if (match) {
                const extracted = parseFloat(match[1]);
                // Validate the price is within a reasonable range
                if (extracted > 0 && extracted < 1000) {
                    price = extracted;
                    matchedPattern = true;
                    break;
                }
            }
        }
        
        if (!price) return;
        
        // Convert from cents to euros/dollars if needed (e.g., 199 -> 1.99)
        if (price >= 100 && price < 1000 && !line.includes('.')) {
            price = price / 100;
        }
        
        // Determine fuel type based on keywords in the line
        let type = '';
        
        // Check for diesel variants first (more specific)
        if (premiumDieselKeywords.some(keyword => line.includes(keyword))) {
            type = 'diesel_premium';
        } 
        else if (dieselKeywords.some(keyword => line.includes(keyword))) {
            type = 'diesel';
        }
        // Then check for petrol/unleaded variants
        else if (premiumFuelKeywords.some(keyword => line.includes(keyword))) {
            type = 'unleaded_premium';
        }
        else if (regularFuelKeywords.some(keyword => line.includes(keyword))) {
            type = 'unleaded';
        }
        // If we can't determine the type but the price looks reasonable, add it as unknown
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

    // Clean up temp files
    try {
      await fs.promises.unlink(originalFilePath);
      if (preprocessed) {
        await fs.promises.unlink(processedFilePath);
      }
      console.log('Temporary files cleaned up');
    } catch (cleanupError) {
      console.error('Error cleaning up temp files:', cleanupError);
    }

    // Return both the raw text and the extracted fuel prices
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