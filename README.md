# Atlassian Community Dashboard - Frontend

Modern React TypeScript frontend for monitoring Atlassian Community activity with real-time analytics and sentiment analysis.

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Lucide React** - Icons

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## 📋 Environment Variables

Create `.env.local` from `.env.example`:

```bash
# Backend API URL
VITE_API_URL=http://localhost:8000
```

## 🌐 Deployment (Vercel)

1. **Connect to GitHub** - Import your repository in Vercel
2. **Set Environment Variables** in Vercel dashboard:
   - `VITE_API_URL`: Your Railway backend URL
3. **Deploy** - Vercel auto-detects Vite and deploys

### Vercel Environment Variables
```
VITE_API_URL=https://your-backend.up.railway.app
```

## 📦 Features

- ✅ Real-time dashboard with live data
- ✅ Sentiment analysis visualization 
- ✅ Community posts management
- ✅ Trending topics tracking
- ✅ Forum activity comparison
- ✅ Responsive design
- ✅ Error boundaries & loading states

## 🏗️ Build Configuration

The app includes:
- `vercel.json` - Vercel deployment configuration
- Automatic SPA routing handling
- Optimized production builds
- Environment variable injection

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

Built with ❤️ using modern web technologies.