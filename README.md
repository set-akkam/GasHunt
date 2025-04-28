# Fuel Price Tracker

A web application that allows users to track and share fuel prices at different stations in real-time.

## Features

### User Authentication
- User registration and login
- Password reset functionality via email
- Secure authentication using JWT tokens
- Profile management (username and password updates)

### Core Functionality
- Interactive map interface for finding fuel stations
- Real-time fuel price submissions (login required)
- Multiple fuel type support
- Voting system for price accuracy
- Station-specific price history
- Leaderboard system
- Dashboard for user statistics
- OCR fuel price extraction from photos
- Price validation based on Ireland's historical fuel price ranges (€1.10-€2.30)

### Pages
- `/landing` - Welcome page
- `/dashboard` - User dashboard
- `/map` - Interactive fuel station map
- `/station` - Individual station details
- `/leaderboard` - User contribution rankings
- `/test-map` - Testing environment for map features

## Technical Stack

### Frontend
- Next.js 13+ (App Router)
- React
- TailwindCSS for styling
- Server-side and client-side rendering capabilities

### Backend Services
- Google Cloud Vision API for OCR processing
- Image preprocessing with Sharp

### Development Tools
- TypeScript support
- ESLint for code quality
- PostCSS for CSS processing
- Environment variable support

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env.local` file with required environment variables
4. Run the development server:
```bash
npm run dev
```

## Environment Variables
Create a `.env.local` file with:
- Required API keys
- Backend service URLs
- Other configuration variables

### Google Cloud Vision API Setup
To use the OCR feature, you need to set up the Google Cloud Vision API:

1. Create a Google Cloud project
2. Enable the Cloud Vision API
3. Create a service account and download the JSON key file
4. Place the key file in `config/keys/google-cloud-credentials.json`
5. Add `GOOGLE_APPLICATION_CREDENTIALS=config/keys/google-cloud-credentials.json` to your `.env` file

## OCR Fuel Price Extraction

The OCR feature allows users to submit fuel prices by taking photos of price signs, making the submission process faster and more convenient.

### How it Works

1. **Image Capture**: Users can take photos directly through the app or upload an existing image.
2. **Image Processing**: 
   - Server-side preprocessing improves image quality for better OCR results
   - Adjusts contrast, sharpness, and brightness
   - Reduces noise
3. **Text Extraction**:
   - Google Cloud Vision API extracts all text from the image
4. **Price Recognition**:
   - Advanced parsing algorithms identify fuel prices
   - Matches prices with correct fuel types (Regular, Premium, Diesel)
   - Handles various price formats (e.g., €1.99, 199, $1.99)
5. **User Verification**:
   - Detected prices are displayed for user verification before submission
   - Users can correct any misidentified prices
   - Original image is shown alongside extracted prices for reference

### Handling OCR Challenges

The system includes several features to overcome common OCR challenges:

- **Client-side guidance** for taking clear photos
- **Server-side image preprocessing** to enhance text detection
- **Robust parsing logic** to handle diverse price formats and layouts
- **User confirmation step** to verify results before submission
- **Rate limiting** to manage API costs and prevent abuse

## Project Structure

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
