# eFS - Scanner E-Faktur Pajak DJP

A modern web application for scanning and processing Indonesian e-invoice (E-Faktur) PDFs from the Directorate General of Taxes (DJP) for ACD ICBP NSF systems.

## 📋 Overview

eFS is a Next.js-based application that enables users to:
- Scan QR codes from e-invoice documents
- Extract and parse e-invoice data from PDF files
- Process XML-formatted invoice data
- Export invoice information to various formats (CSV, Excel)
- Manage scanned invoices efficiently

## ⚙️ Tech Stack

- **Frontend Framework**: [Next.js 16.2.9](https://nextjs.org) with App Router
- **React Version**: 19.2.4
- **Styling**: Tailwind CSS 4
- **UI Components**: Lucide React (1.21.0)
- **QR Code**: html5-qrcode (2.3.8), jsqr (1.4.0)
- **Image Processing**: Jimp (1.6.1)
- **XML Parsing**: fast-xml-parser (5.9.3)
- **Data Export**: XLSX (0.18.5), PapaParse (5.5.4)
- **PWA**: @ducanh2912/next-pwa (10.2.6)
- **Linting**: ESLint 9

## 🎯 Features

- ✅ QR Code Scanner - Real-time QR code detection from documents
- ✅ PDF Upload & Processing - Support for E-Faktur PDF documents
- ✅ XML Data Parsing - Extract structured data from invoice XML
- ✅ CSV/Excel Export - Export processed invoices to common formats
- ✅ PWA Support - Progressive Web App for offline capability
- ✅ Responsive Design - Mobile-optimized interface
- ✅ HTTPS Support - Secure development environment

## 📦 Requirements

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/galihaditya404/eFS.git
cd eFS/app
```

2. Install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The app supports hot reloading — any changes to files will automatically update in the browser.

### Production Build

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## 📁 Project Structure

```
app/
├── src/
│   ├── app/           # Next.js App Router pages and layouts
│   ├── components/    # Reusable React components
│   ├── lib/          # Utility functions and helpers
│   └── styles/       # Global styles and Tailwind config
├── public/           # Static assets
├── package.json      # Project dependencies
└── README.md         # This file
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with experimental HTTPS
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Technology Details

### QR Code Processing
Uses **html5-qrcode** and **jsqr** for real-time QR code detection and processing directly from browser cameras or uploaded images.

### Image Processing
**Jimp** handles image manipulation and enhancement for better QR code recognition accuracy.

### Data Formats
- **XML Parsing**: fast-xml-parser for parsing E-Faktur XML structures
- **Excel/CSV**: XLSX and PapaParse for data export functionality

### Progressive Web App
Built with @ducanh2912/next-pwa for offline capability and app-like experience.

## 🌐 Browser Support

eFS works on all modern browsers supporting:
- ES6+ JavaScript
- WebAssembly
- Web Camera API
- Service Workers (for PWA)

## 📝 License

This project is open source and available under the MIT License.

## 👤 Author

**Galih Aditya**
- GitHub: [@galihaditya404](https://github.com/galihaditya404)

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For issues and questions, please [open an issue](https://github.com/galihaditya404/eFS/issues) on GitHub.

## 🔍 Related Links

- [E-Faktur DJP](https://efaktur.pajak.go.id) - Indonesian e-Invoice System
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)

---

**Made with ❤️ for efficient invoice management**
