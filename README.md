# Digital Signature App - FlexiSign

A modern, web-based digital signature application that allows users to add signatures and text to PDF documents and images. Built with Next.js, TypeScript, and Tailwind CSS.

## 🌐 Live Demo

**Visit the live application:** [https://flexisign.net](https://flexisign.net)

## ✨ Features

### 📄 Document Support
- **PDF Documents**: Upload and edit PDF files
- **Image Files**: Support for JPG, PNG, GIF, and other image formats
- **Multi-page PDFs**: Navigate through multiple pages

### ✍️ Signature Features
- **Digital Signature Creation**: Create signatures using mouse/touch
- **Multiple Font Styles**: 20+ beautiful signature fonts including:
  - Alex Brush, Allura, Dancing Script
  - Great Vibes, Pinyon Script, Sacramento
  - Tangerine, Yellowtail, and many more
- **Customizable Colors**: Choose from a color palette
- **Signature Positioning**: Drag and drop signatures anywhere on documents
- **Aspect Ratio Lock**: Maintain signature proportions

### 📝 Text Features
- **Text Boxes**: Add custom text to documents
- **Font Customization**: Adjust font size, color, and family
- **Text Positioning**: Drag and resize text boxes
- **Text Wrapping**: Automatic text wrapping for long content

### 🎯 User Experience
- **Drag & Drop Interface**: Intuitive document editing
- **Real-time Preview**: See changes instantly
- **Responsive Design**: Works on desktop and mobile devices
- **Download Options**: Save signed documents in original format

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/md-sohrab-alam/add-signature.git
   cd add-signature
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Technology Stack

- **Framework**: Next.js 15.3.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PDF Processing**: pdf-lib, react-pdf
- **Signature Canvas**: react-signature-canvas
- **Drag & Drop**: react-rnd
- **Analytics**: Google Analytics 4
- **Deployment**: GitHub Pages

## 📦 Key Dependencies

```json
{
  "next": "latest",
  "react": "latest",
  "pdf-lib": "^1.17.1",
  "react-pdf": "^7.7.0",
  "react-signature-canvas": "^1.0.6",
  "react-rnd": "^10.5.2",
  "tailwindcss": "^3.3.0"
}
```

## 🎨 Font Dependencies

The app includes 20+ signature fonts from Fontsource:

```json
{
  "@fontsource/alex-brush": "^5.2.6",
  "@fontsource/allura": "^5.2.6",
  "@fontsource/dancing-script": "^5.2.6",
  "@fontsource/great-vibes": "^5.2.6",
  "@fontsource/pinyon-script": "^5.2.6",
  "@fontsource/sacramento": "^5.2.6",
  "@fontsource/tangerine": "^5.2.6",
  "@fontsource/yellowtail": "^5.2.6"
  // ... and 12 more fonts
}
```

## 📁 Project Structure

```
add-signature/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with analytics
│   │   ├── page.tsx            # Main application page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── SignatureEditor.tsx # Signature creation component
│   │   └── GoogleAnalytics.tsx # Analytics tracking
│   └── lib/
│       ├── analytics.ts        # Google Analytics configuration
│       └── utils.ts           # Utility functions
├── public/                    # Static assets
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 🔧 Configuration

### Google Analytics
The app includes Google Analytics 4 tracking. To configure:

1. Create a `.env.local` file in the root directory
2. Add your GA4 Measurement ID:
   ```env
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-YOUR_MEASUREMENT_ID
   ```

### Custom Domain
The app is configured for deployment on a custom domain. Update `next.config.js` if needed:

```javascript
const nextConfig = {
  output: 'export',
  basePath: '', // Set to your domain path if needed
  assetPrefix: '',
  trailingSlash: true,
}
```

## 📊 Analytics Tracking

The app tracks the following events:
- **Page Views**: All page visits
- **File Uploads**: Document uploads with file type and size
- **Signature Creation**: When users create signatures
- **Text Additions**: When users add text boxes
- **Document Downloads**: When users download signed documents

## 🚀 Deployment

### GitHub Pages
The app is configured for GitHub Pages deployment:

```bash
npm run build
npm run deploy
```

### Custom Domain
1. Add your domain to GitHub repository settings
2. Configure DNS records to point to GitHub Pages
3. Update the `CNAME` file with your domain

## 🎯 Usage Guide

### Adding a Signature
1. Upload a PDF or image file
2. Click "Add Signature" button
3. Draw your signature using mouse/touch
4. Choose font style and color
5. Click "Save Signature"
6. Drag the signature to desired position
7. Resize if needed

### Adding Text
1. Click "Add Text" button
2. Type your text in the text box
3. Customize font size, color, and family
4. Drag to position and resize as needed

### Downloading Documents
1. Click "Save Document" button
2. The signed document will download automatically
3. File will be saved with "signed-" prefix

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation
- [Fontsource](https://fontsource.org/) - Web fonts
- [Google Analytics](https://analytics.google.com/) - Analytics tracking

## 📞 Support

For support, please open an issue on GitHub or contact the maintainer.

---

**Made with ❤️ by [md-sohrab-alam](https://github.com/md-sohrab-alam)**

**Live Demo:** [https://flexisign.net](https://flexisign.net) 