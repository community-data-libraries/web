# Community Data Libraries

A curated collection of data science resources and community-submitted materials for researchers, students, and practitioners.

## 🚀 Project Overview

Community Data Libraries is an open-source web platform built with Astro and React that provides:

- **Master Library**: Carefully curated high-quality datasets, tools, guides, and research papers
- **Community Library**: User-submitted resources from the global data science community
- **Resource Submission**: Easy-to-use interface for contributing resources
- **Search & Discovery**: Find relevant resources quickly with advanced filtering

## 🛠️ Technology Stack

- **[Astro](https://astro.build/)** - Modern static site generator with hybrid SSR/SSG capabilities
- **[React](https://react.dev/)** - UI components with selective hydration
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **Content Collections** - Type-safe content management for resources

## 📁 Project Structure

```
/
├── public/                 # Static assets
│   └── favicon.svg
├── src/
│   ├── components/        # Reusable Astro components
│   │   └── Navigation.astro
│   ├── content/           # Content collections
│   │   ├── config.ts      # Content schema definitions
│   │   └── master-library/  # Curated resources (markdown)
│   ├── data/              # JSON data files
│   ├── layouts/           # Page layouts
│   │   └── Layout.astro
│   └── pages/             # File-based routing
│       ├── index.astro    # Homepage
│       └── 404.astro      # Error page
├── astro.config.mjs       # Astro configuration
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## 🏁 Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/community-data-libraries/web.git
cd web
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:4321`

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run astro` | Run Astro CLI commands |

## 🎨 Key Features

### Hybrid Rendering
The project uses Astro's hybrid rendering mode, allowing you to:
- Generate static pages for better performance
- Use server-side rendering for dynamic content
- Choose the best approach per page

### Content Collections
Resources are managed through Astro's content collections system:
- Type-safe content with Zod schemas
- Automatic TypeScript types
- Easy to query and filter

### Path Aliases
Configured TypeScript path aliases for cleaner imports:
```typescript
import Layout from '@layouts/Layout.astro';
import Navigation from '@components/Navigation.astro';
```

### Responsive Design
Mobile-first design with:
- Responsive navigation with hamburger menu
- Flexible grid layouts
- Accessible markup with ARIA labels

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Adding Resources

1. Create a new markdown file in `src/content/master-library/`
2. Follow the schema defined in `src/content/config.ts`
3. Include all required frontmatter fields
4. Submit a pull request

Example resource frontmatter:
```yaml
---
title: "Your Resource Title"
description: "A detailed description of the resource"
author: "Author Name"
publishedDate: 2024-01-15
tags: ["tag1", "tag2"]
category: "dataset"  # or "tool", "guide", "paper"
url: "https://example.com"
---
```

### Code Contributions

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/community-data-libraries/web/issues) on GitHub.

## 📝 Content Guidelines

When submitting resources:

- **Be Descriptive**: Provide clear, comprehensive descriptions
- **Tag Appropriately**: Use relevant, specific tags
- **Verify Links**: Ensure all URLs are valid and active
- **Follow Schema**: Match the defined content collection schema
- **Quality Over Quantity**: Focus on high-quality, valuable resources

## 🔒 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🌟 Acknowledgments

- Built with [Astro](https://astro.build/)
- Icons from emoji (📚, 📊, 🌍, ✨)
- Inspired by the open data and open source communities

## 📞 Contact

- **GitHub**: [community-data-libraries/web](https://github.com/community-data-libraries/web)
- **Issues**: [Report a bug or request a feature](https://github.com/community-data-libraries/web/issues)

## 🗺️ Roadmap

- [x] Week 1: Project initialization with Astro + React
- [ ] Week 2: API integration for dynamic content
- [ ] Week 3: Community submission forms
- [ ] Week 4: Search and filtering functionality
- [ ] Week 5: User authentication
- [ ] Week 6: Deployment and production release

---

**Made with ❤️ by the Community Data Libraries team**
