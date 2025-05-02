# Fuel Price Tracker

A web application that allows users to track and share fuel prices at different stations in real-time.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Cloud account (for OCR functionality)
- Git

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd fuel-price-tracker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS=config/keys/google-cloud-credentials.json

# Add other environment variables as needed
```

4. Set up Google Cloud Vision API:
   - Create a Google Cloud project
   - Enable the Cloud Vision API
   - Create a service account and download the JSON key file
   - Place the key file in `config/keys/google-cloud-credentials.json`

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:3000

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Project Structure

- `/app` - Next.js app router pages and components
- `/backend` - Express server and API routes
- `/config` - Configuration files and credentials
- `/contexts` - React context providers
- `/public` - Static assets
- `/types` - TypeScript type definitions

## Features

- Real-time fuel price tracking
- Interactive map interface
- OCR fuel price extraction from photos
- User authentication
- Price history and statistics
- Leaderboard system

## Technologies Used

- Next.js 13+ (App Router)
- React
- TypeScript
- TailwindCSS
- Google Cloud Vision API
- Express.js
- Socket.IO
- Chart.js
- Leaflet Maps

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
