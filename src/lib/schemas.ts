export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "pdfkit.pro",
    url: "https://www.pdfkit.pro",
    description: "20 free PDF tools that run in your browser. Merge, split, compress, convert, edit, sign and search PDFs. No uploads, no signup.",
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "pdfkit.pro",
    url: "https://www.pdfkit.pro",
    logo: "https://www.pdfkit.pro/logo.svg",
    description: "20 free PDF tools that run in your browser. Files never leave your device. The site counts page views with Vercel Analytics.",
    sameAs: [],
    founder: {
      "@type": "Person",
      name: "Siddhartha Chauhan",
    },
  };
}

export function getSoftwareAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "pdfkit.pro",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url: "https://www.pdfkit.pro",
    description: "Browser-based PDF toolkit with 20 tools. Merge, split, compress, convert, edit, sign and search PDFs. Files never leave your device.",
  };
}

export function getToolFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function getHowToSchema(
  name: string,
  description: string,
  steps: { step: string; description: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.step,
      text: s.description,
    })),
    tool: {
      "@type": "HowToTool",
      name: "Web Browser",
    },
  };
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getArticleSchema(
  title: string,
  description: string,
  slug: string,
  datePublished: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `https://www.pdfkit.pro/blog/${slug}`,
    datePublished,
    dateModified: datePublished,
    author: {
      "@type": "Person",
      name: "Siddhartha Chauhan",
    },
    publisher: {
      "@type": "Organization",
      name: "pdfkit.pro",
      logo: {
        "@type": "ImageObject",
        url: "https://www.pdfkit.pro/logo.svg",
      },
    },
  };
}
