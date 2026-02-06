export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "pdfkit.pro",
    url: "https://pdfkit.pro",
    description: "Free browser-based PDF tools. Merge, split, compress, convert, edit and chat with PDFs. No uploads, no signup.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://pdfkit.pro/tools?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "pdfkit.pro",
    url: "https://pdfkit.pro",
    logo: "https://pdfkit.pro/logo.svg",
    description: "Free browser-based AI PDF toolkit. All processing runs locally for maximum privacy.",
    sameAs: [],
    founder: {
      "@type": "Person",
      name: "Sidheart",
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
    description: "All-in-one browser-based PDF toolkit with 20+ tools. Merge, split, compress, convert, edit, sign, and chat with PDFs.",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
      bestRating: "5",
    },
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
    url: `https://pdfkit.pro/blog/${slug}`,
    datePublished,
    dateModified: datePublished,
    author: {
      "@type": "Person",
      name: "Sidheart",
    },
    publisher: {
      "@type": "Organization",
      name: "pdfkit.pro",
      logo: {
        "@type": "ImageObject",
        url: "https://pdfkit.pro/logo.svg",
      },
    },
  };
}
