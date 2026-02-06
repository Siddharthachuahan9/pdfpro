export interface ToolSEO {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  h1: string;
  h2Intro: string;
  introParagraph: string;
  howToSteps: { step: string; description: string }[];
  faqs: { question: string; answer: string }[];
  benefits: string[];
  relatedTools: string[];
}

export const toolSEOData: Record<string, ToolSEO> = {
  merge: {
    metaTitle: "Merge PDF Online Free - Combine PDF Files Instantly | pdfkit.pro",
    metaDescription: "Merge multiple PDF files into one document online for free. No upload to servers, no signup. Fast browser-based PDF merger that keeps your files private.",
    keywords: ["merge pdf", "combine pdf", "join pdf", "merge pdf online free", "pdf combiner", "merge pdf files"],
    h1: "Merge PDF Files Online for Free",
    h2Intro: "How to Merge PDF Files",
    introParagraph: "Combine multiple PDF documents into a single file in seconds. Our browser-based PDF merger processes everything locally on your device — your files are never uploaded to any server. Simply drag and drop your PDFs, reorder them as needed, and download the merged result.",
    howToSteps: [
      { step: "Upload PDFs", description: "Drag and drop or select multiple PDF files you want to merge." },
      { step: "Reorder Files", description: "Arrange the PDFs in your desired order using the up/down buttons." },
      { step: "Merge & Download", description: "Click Merge PDFs and download your combined document instantly." }
    ],
    faqs: [
      { question: "Is it safe to merge PDFs online?", answer: "Yes, pdfkit.pro processes all files locally in your browser. Your PDFs are never uploaded to any server, making it completely safe and private." },
      { question: "How many PDFs can I merge at once?", answer: "There is no limit to the number of PDFs you can merge. You can combine as many files as your browser memory allows." },
      { question: "Will merging reduce the quality of my PDFs?", answer: "No, our PDF merger preserves the original quality of all documents. Text, images, and formatting remain unchanged." },
      { question: "Do I need to create an account to merge PDFs?", answer: "No, pdfkit.pro is completely free with no signup or registration required." }
    ],
    benefits: ["No file size limits", "No watermarks added", "Preserves original quality", "Works offline after loading", "100% private and secure"],
    relatedTools: ["split", "compress", "reorder-pages", "add-page-numbers"]
  },
  split: {
    metaTitle: "Split PDF Online Free - Extract Pages from PDF | pdfkit.pro",
    metaDescription: "Split PDF files into multiple documents or extract specific pages online for free. No uploads, no signup. Browser-based PDF splitter with instant processing.",
    keywords: ["split pdf", "extract pdf pages", "separate pdf", "split pdf online free", "pdf splitter", "pdf page extractor"],
    h1: "Split PDF into Multiple Files Online",
    h2Intro: "How to Split a PDF Document",
    introParagraph: "Extract specific pages or split a PDF into multiple separate files instantly. Enter custom page ranges to create exactly the documents you need. Everything runs locally in your browser for maximum privacy and speed.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop the PDF file you want to split." },
      { step: "Set Page Ranges", description: "Enter the page ranges you want to extract (e.g., 1-3, 4-6, 7-10)." },
      { step: "Split & Download", description: "Click Split PDF and download each resulting file separately." }
    ],
    faqs: [
      { question: "Can I extract specific pages from a PDF?", answer: "Yes, you can specify exact page ranges like 1-3, 5, 8-10 to extract only the pages you need." },
      { question: "Is the PDF splitter free to use?", answer: "Yes, completely free with no limits, no watermarks, and no registration required." },
      { question: "Can I split a large PDF file?", answer: "Yes, since processing happens in your browser, you can split PDFs of any size that your device can handle." }
    ],
    benefits: ["Custom page ranges", "Multiple output files", "No quality loss", "Instant processing", "No file uploads"],
    relatedTools: ["merge", "delete-pages", "extract-text", "reorder-pages"]
  },
  compress: {
    metaTitle: "Compress PDF Online Free - Reduce PDF File Size | pdfkit.pro",
    metaDescription: "Reduce PDF file size online for free without losing quality. No upload required. Browser-based PDF compressor with instant size reduction.",
    keywords: ["compress pdf", "reduce pdf size", "pdf compressor", "compress pdf online free", "shrink pdf", "make pdf smaller"],
    h1: "Compress PDF Files Online for Free",
    h2Intro: "How to Compress a PDF",
    introParagraph: "Reduce the file size of your PDF documents while maintaining quality. Our browser-based compressor optimizes your PDFs by removing unused objects and streamlining the internal structure. See the original and compressed sizes side by side.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop the PDF file you want to compress." },
      { step: "Compress", description: "Click Compress PDF to optimize the file size." },
      { step: "Download", description: "Compare the file sizes and download your compressed PDF." }
    ],
    faqs: [
      { question: "How much can I reduce my PDF size?", answer: "Compression results vary depending on the PDF content. Documents with embedded images typically see larger reductions." },
      { question: "Will compression affect PDF quality?", answer: "Our compressor optimizes the internal structure without degrading visible content quality." },
      { question: "Is there a file size limit?", answer: "No hard limit — your browser memory is the only constraint." }
    ],
    benefits: ["Side-by-side size comparison", "No quality degradation", "Instant results", "Works with any PDF", "Free forever"],
    relatedTools: ["merge", "split", "crop-pdf", "edit-pdf"]
  },
  "pdf-to-jpg": {
    metaTitle: "PDF to JPG Converter Online Free - Convert PDF to Images | pdfkit.pro",
    metaDescription: "Convert PDF pages to high-quality JPG images online for free. No upload, no signup. Browser-based PDF to image converter with instant download.",
    keywords: ["pdf to jpg", "pdf to image", "convert pdf to jpg", "pdf to jpeg", "pdf to jpg converter online free"],
    h1: "Convert PDF to JPG Images Online",
    h2Intro: "How to Convert PDF to JPG",
    introParagraph: "Convert every page of your PDF document into high-quality JPG images. Perfect for sharing individual pages, creating thumbnails, or using PDF content in presentations. All conversion happens locally in your browser.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop the PDF file you want to convert." },
      { step: "Convert", description: "Click Convert to JPG to process all pages." },
      { step: "Download Images", description: "Preview and download individual images or all at once." }
    ],
    faqs: [
      { question: "What quality are the output JPG images?", answer: "Images are rendered at 2x resolution with 90% JPEG quality for crisp, clear results." },
      { question: "Can I convert a multi-page PDF?", answer: "Yes, every page is converted to a separate JPG image that you can download individually." }
    ],
    benefits: ["High-resolution output", "Preview before download", "Download all at once", "No watermarks", "Completely free"],
    relatedTools: ["jpg-to-pdf", "png-to-pdf", "extract-text", "edit-pdf"]
  },
  "jpg-to-pdf": {
    metaTitle: "JPG to PDF Converter Online Free - Images to PDF | pdfkit.pro",
    metaDescription: "Convert JPG images to PDF format online for free. Combine multiple images into one PDF. No upload to servers, no signup. Fast and private.",
    keywords: ["jpg to pdf", "image to pdf", "convert jpg to pdf", "jpeg to pdf", "photo to pdf", "pictures to pdf"],
    h1: "Convert JPG Images to PDF Online",
    h2Intro: "How to Convert JPG to PDF",
    introParagraph: "Transform your JPG images into a professional PDF document. Upload multiple images and they will be combined into a single PDF file with each image on its own page. Perfect for creating photo albums, portfolios, or document scans.",
    howToSteps: [
      { step: "Upload Images", description: "Select or drag and drop one or more JPG/JPEG images." },
      { step: "Convert", description: "Click Convert to PDF to create your document." },
      { step: "Download PDF", description: "Download your new PDF file instantly." }
    ],
    faqs: [
      { question: "Can I convert multiple JPGs at once?", answer: "Yes, upload as many JPG files as you need and they will all be combined into a single PDF." },
      { question: "Does conversion change image quality?", answer: "No, images are embedded at their original resolution and quality." }
    ],
    benefits: ["Multiple images to one PDF", "Original quality preserved", "Automatic page sizing", "No registration needed", "Browser-based processing"],
    relatedTools: ["png-to-pdf", "pdf-to-jpg", "merge", "compress"]
  },
  "png-to-pdf": {
    metaTitle: "PNG to PDF Converter Online Free - Convert PNG to PDF | pdfkit.pro",
    metaDescription: "Convert PNG images to PDF format online for free. No upload, no signup required. Combine multiple PNG files into a single PDF document.",
    keywords: ["png to pdf", "convert png to pdf", "png to pdf converter", "png to pdf online free"],
    h1: "Convert PNG Images to PDF Online",
    h2Intro: "How to Convert PNG to PDF",
    introParagraph: "Convert your PNG images into a PDF document while preserving transparency and quality. Upload multiple PNG files to create a multi-page PDF instantly. All processing happens locally in your browser.",
    howToSteps: [
      { step: "Upload PNGs", description: "Select or drag and drop one or more PNG images." },
      { step: "Convert", description: "Click Convert to PDF to generate your document." },
      { step: "Download", description: "Download the resulting PDF file." }
    ],
    faqs: [
      { question: "Is PNG transparency preserved?", answer: "PNG images are embedded as-is into the PDF, preserving their transparency information." },
      { question: "Can I combine multiple PNGs?", answer: "Yes, all uploaded PNG files are combined into a single PDF with one image per page." }
    ],
    benefits: ["Preserves transparency", "Multiple files supported", "No quality loss", "Fast processing", "Free to use"],
    relatedTools: ["jpg-to-pdf", "pdf-to-jpg", "merge", "edit-pdf"]
  },
  "word-to-pdf": {
    metaTitle: "Word to PDF Converter Online Free - DOCX to PDF | pdfkit.pro",
    metaDescription: "Convert Word documents to PDF format online for free. No upload to servers. Browser-based DOCX to PDF converter with instant download.",
    keywords: ["word to pdf", "docx to pdf", "convert word to pdf", "doc to pdf", "word to pdf converter online free"],
    h1: "Convert Word to PDF Online for Free",
    h2Intro: "How to Convert Word to PDF",
    introParagraph: "Transform your Word documents (.docx) into professional PDF files instantly. Our browser-based converter extracts text content from your Word file and generates a clean PDF. No Microsoft Office or server upload required.",
    howToSteps: [
      { step: "Upload Document", description: "Select or drag and drop your .docx Word file." },
      { step: "Convert", description: "Click Convert to PDF to process your document." },
      { step: "Download PDF", description: "Download the converted PDF file." }
    ],
    faqs: [
      { question: "Which Word formats are supported?", answer: "We support .docx format (Microsoft Word 2007 and later). For .doc files, save them as .docx first." },
      { question: "Is formatting preserved?", answer: "Text content is extracted and formatted into a clean PDF. Complex layouts may be simplified." }
    ],
    benefits: ["No Microsoft Office needed", "Instant conversion", "Privacy-first", "No file size limits", "Free forever"],
    relatedTools: ["pdf-to-word", "extract-text", "edit-pdf", "compress"]
  },
  "pdf-to-word": {
    metaTitle: "PDF to Word Converter Online Free - PDF to Text | pdfkit.pro",
    metaDescription: "Extract text from PDF files and convert to editable format online for free. No upload, no signup. Browser-based PDF text extractor.",
    keywords: ["pdf to word", "pdf to text", "extract text from pdf", "pdf converter", "pdf to word converter online free"],
    h1: "Convert PDF to Word (Text) Online",
    h2Intro: "How to Extract Text from PDF",
    introParagraph: "Extract all text content from your PDF documents and convert it to an editable format. Copy the text to your clipboard or download it as a text file. Ideal for repurposing PDF content in other documents.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop the PDF file you want to convert." },
      { step: "Extract Text", description: "Click Extract Text to process the PDF content." },
      { step: "Copy or Download", description: "Copy the text to clipboard or download as a .txt file." }
    ],
    faqs: [
      { question: "Can it extract text from scanned PDFs?", answer: "This tool works with text-based PDFs. For scanned documents, you may need OCR processing." },
      { question: "Is the extracted text formatted?", answer: "Text is organized by page with clear page separators for easy navigation." }
    ],
    benefits: ["Copy to clipboard", "Download as text", "Page-by-page extraction", "Works with any PDF", "No registration"],
    relatedTools: ["extract-text", "word-to-pdf", "chat-with-pdf", "edit-pdf"]
  },
  "extract-text": {
    metaTitle: "Extract Text from PDF Online Free - PDF Text Extractor | pdfkit.pro",
    metaDescription: "Extract all text content from PDF files online for free. Copy text or download as TXT. No upload to servers, browser-based processing.",
    keywords: ["extract text from pdf", "pdf text extractor", "copy text from pdf", "pdf to text", "extract pdf text online free"],
    h1: "Extract Text from PDF Online",
    h2Intro: "How to Extract Text from a PDF",
    introParagraph: "Pull all text content from your PDF documents instantly. View extracted text organized by page, copy it to your clipboard with one click, or download as a plain text file. All processing happens locally in your browser.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop your PDF file." },
      { step: "Extract", description: "Click Extract Text to pull all text content." },
      { step: "Copy or Download", description: "Use the copy button or download the text file." }
    ],
    faqs: [
      { question: "Does it work with image-based PDFs?", answer: "This tool extracts embedded text. For scanned/image PDFs, OCR would be needed." },
      { question: "Can I extract text from specific pages?", answer: "The tool extracts text from all pages, with clear page separators so you can easily find content." }
    ],
    benefits: ["One-click copy", "Character count", "Page separators", "Download as TXT", "Free and private"],
    relatedTools: ["pdf-to-word", "chat-with-pdf", "edit-pdf", "word-to-pdf"]
  },
  watermark: {
    metaTitle: "Add Watermark to PDF Online Free - PDF Watermark Tool | pdfkit.pro",
    metaDescription: "Add text watermarks to PDF documents online for free. Customize text, size, opacity, rotation and position. No upload, browser-based processing.",
    keywords: ["add watermark to pdf", "pdf watermark", "watermark pdf online free", "stamp pdf", "pdf watermark tool"],
    h1: "Add Watermark to PDF Online",
    h2Intro: "How to Add a Watermark to PDF",
    introParagraph: "Protect and brand your PDF documents by adding customizable text watermarks. Control the text, font size, opacity, rotation angle, and position. Apply watermarks to all pages at once with instant preview and download.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop your PDF file." },
      { step: "Customize Watermark", description: "Set your watermark text, size, opacity, rotation, and position." },
      { step: "Apply & Download", description: "Click Add Watermark and download your watermarked PDF." }
    ],
    faqs: [
      { question: "Can I customize the watermark position?", answer: "Yes, choose from center, top-left, top-right, bottom-left, or bottom-right positions." },
      { question: "Will the watermark appear on all pages?", answer: "Yes, the watermark is applied to every page of your PDF document." }
    ],
    benefits: ["Customizable text", "Adjustable opacity", "Multiple positions", "Rotation control", "Free to use"],
    relatedTools: ["protect-pdf", "sign-pdf", "add-page-numbers", "edit-pdf"]
  },
  rotate: {
    metaTitle: "Rotate PDF Online Free - Rotate PDF Pages | pdfkit.pro",
    metaDescription: "Rotate PDF pages 90, 180, or 270 degrees online for free. Fix upside-down or sideways PDF pages. No upload, browser-based processing.",
    keywords: ["rotate pdf", "rotate pdf pages", "rotate pdf online free", "turn pdf", "flip pdf"],
    h1: "Rotate PDF Pages Online for Free",
    h2Intro: "How to Rotate PDF Pages",
    introParagraph: "Fix the orientation of your PDF pages by rotating them 90, 180, or 270 degrees. Perfect for correcting scanned documents, flipped pages, or landscape-to-portrait conversions.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop your PDF file." },
      { step: "Choose Angle", description: "Select 90 clockwise, 180, or 90 counter-clockwise." },
      { step: "Rotate & Download", description: "Click Rotate PDF and download the corrected file." }
    ],
    faqs: [
      { question: "Can I rotate specific pages only?", answer: "Currently, rotation is applied to all pages. For selective rotation, use Edit PDF." },
      { question: "Does rotation affect PDF quality?", answer: "No, rotation only changes the page orientation without affecting content quality." }
    ],
    benefits: ["Three rotation angles", "Preserves quality", "Instant processing", "All pages at once", "Free and private"],
    relatedTools: ["crop-pdf", "edit-pdf", "delete-pages", "reorder-pages"]
  },
  "delete-pages": {
    metaTitle: "Delete PDF Pages Online Free - Remove Pages from PDF | pdfkit.pro",
    metaDescription: "Remove unwanted pages from PDF files online for free. Select and delete specific pages with visual page selector. No upload, browser-based.",
    keywords: ["delete pdf pages", "remove pages from pdf", "delete pdf pages online free", "pdf page remover"],
    h1: "Delete Pages from PDF Online",
    h2Intro: "How to Remove PDF Pages",
    introParagraph: "Remove unwanted pages from your PDF documents with a simple visual selector. Click on the page numbers you want to delete, then download the cleaned-up PDF. All processing happens locally in your browser.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop your PDF file." },
      { step: "Select Pages", description: "Click on the page numbers you want to remove." },
      { step: "Delete & Download", description: "Click Delete and download the cleaned PDF." }
    ],
    faqs: [
      { question: "Can I delete multiple pages at once?", answer: "Yes, select as many pages as you want to remove and delete them all at once." },
      { question: "Can I undo after deleting?", answer: "The original file is never modified. If you need different pages removed, simply re-upload." }
    ],
    benefits: ["Visual page selector", "Multi-page selection", "Preserves remaining content", "Instant processing", "No signup required"],
    relatedTools: ["split", "reorder-pages", "merge", "edit-pdf"]
  },
  "reorder-pages": {
    metaTitle: "Reorder PDF Pages Online Free - Rearrange PDF | pdfkit.pro",
    metaDescription: "Rearrange and reorder PDF pages online for free. Move pages up and down to create your desired order. No upload, browser-based processing.",
    keywords: ["reorder pdf pages", "rearrange pdf", "move pdf pages", "reorder pdf online free", "pdf page sorter"],
    h1: "Reorder PDF Pages Online for Free",
    h2Intro: "How to Rearrange PDF Pages",
    introParagraph: "Rearrange the pages of your PDF document in any order you want. Use the intuitive up/down controls to move pages to their correct positions. Download the reordered PDF when you are done.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop your PDF file." },
      { step: "Reorder Pages", description: "Use the Up/Down buttons to move pages to desired positions." },
      { step: "Save & Download", description: "Click Reorder Pages and download the rearranged PDF." }
    ],
    faqs: [
      { question: "Can I reorder all pages?", answer: "Yes, you can move any page to any position in the document." },
      { question: "Is the original PDF modified?", answer: "No, a new PDF is created with your specified page order. The original file is unchanged." }
    ],
    benefits: ["Intuitive controls", "Any page order", "Original unchanged", "Instant results", "Completely free"],
    relatedTools: ["merge", "delete-pages", "split", "add-page-numbers"]
  },
  "add-page-numbers": {
    metaTitle: "Add Page Numbers to PDF Online Free | pdfkit.pro",
    metaDescription: "Add page numbers to PDF documents online for free. Choose position, starting number, and font size. No upload, browser-based processing.",
    keywords: ["add page numbers to pdf", "pdf page numbers", "number pdf pages", "add page numbers online free"],
    h1: "Add Page Numbers to PDF Online",
    h2Intro: "How to Add Page Numbers to PDF",
    introParagraph: "Add professional page numbers to your PDF documents. Choose from six positioning options, set a custom starting number, and adjust the font size to match your document style.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop your PDF file." },
      { step: "Configure", description: "Choose position, starting number, and font size." },
      { step: "Apply & Download", description: "Click Add Page Numbers and download the numbered PDF." }
    ],
    faqs: [
      { question: "Where can I place page numbers?", answer: "Choose from bottom-center, bottom-left, bottom-right, top-center, top-left, or top-right." },
      { question: "Can I start from a specific number?", answer: "Yes, you can set any starting number for your page numbering." }
    ],
    benefits: ["6 position options", "Custom start number", "Adjustable font size", "All pages numbered", "Free and private"],
    relatedTools: ["watermark", "edit-pdf", "merge", "reorder-pages"]
  },
  "sign-pdf": {
    metaTitle: "Sign PDF Online Free - Add Signature to PDF | pdfkit.pro",
    metaDescription: "Draw and add your signature to PDF documents online for free. Touch-friendly signature pad. No upload, no signup. Browser-based PDF signer.",
    keywords: ["sign pdf", "add signature to pdf", "pdf signature", "sign pdf online free", "electronic signature pdf"],
    h1: "Sign PDF Documents Online for Free",
    h2Intro: "How to Sign a PDF",
    introParagraph: "Add your handwritten signature to any PDF document. Use our touch-friendly signature pad to draw your signature, then place it on your PDF. Works on desktop and mobile devices. Your signature and document never leave your device.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop the PDF you want to sign." },
      { step: "Draw Signature", description: "Use the signature pad to draw your signature with mouse or touch." },
      { step: "Sign & Download", description: "Click Sign PDF and download your signed document." }
    ],
    faqs: [
      { question: "Is this a legally binding signature?", answer: "This creates a visual signature on the PDF. For legally binding electronic signatures, a certified service may be required depending on your jurisdiction." },
      { question: "Can I sign on a touchscreen?", answer: "Yes, the signature pad fully supports touch input on tablets and phones." }
    ],
    benefits: ["Touch-friendly", "Works on mobile", "Clear/redraw option", "Privacy-first", "No account needed"],
    relatedTools: ["edit-pdf", "watermark", "protect-pdf", "add-page-numbers"]
  },
  "protect-pdf": {
    metaTitle: "Protect PDF with Password Online Free | pdfkit.pro",
    metaDescription: "Add password protection to PDF files online for free. Secure your documents with encryption. No upload, browser-based PDF protection.",
    keywords: ["protect pdf", "password pdf", "encrypt pdf", "secure pdf", "protect pdf online free", "pdf password"],
    h1: "Protect PDF with Password Online",
    h2Intro: "How to Password Protect a PDF",
    introParagraph: "Add password protection to your PDF documents to prevent unauthorized access. Enter your desired password and download the protected file. All processing happens locally in your browser for maximum security.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop the PDF you want to protect." },
      { step: "Set Password", description: "Enter a strong password for your document." },
      { step: "Protect & Download", description: "Click Protect PDF and download the secured file." }
    ],
    faqs: [
      { question: "How secure is the protection?", answer: "Browser-based encryption has limitations. For maximum security, consider desktop encryption tools." },
      { question: "Can I remove the password later?", answer: "Yes, use our Unlock PDF tool to remove password protection." }
    ],
    benefits: ["Password protection", "Local processing", "No data stored", "Quick and easy", "Free to use"],
    relatedTools: ["unlock-pdf", "watermark", "sign-pdf", "edit-pdf"]
  },
  "unlock-pdf": {
    metaTitle: "Unlock PDF Online Free - Remove PDF Password | pdfkit.pro",
    metaDescription: "Remove password protection from PDF files online for free. Unlock restricted PDFs instantly. No upload, browser-based PDF unlocker.",
    keywords: ["unlock pdf", "remove pdf password", "pdf unlocker", "unlock pdf online free", "remove pdf protection"],
    h1: "Unlock PDF - Remove Password Online",
    h2Intro: "How to Unlock a PDF",
    introParagraph: "Remove password protection from PDF documents. Upload your protected PDF, enter the password if required, and download an unlocked version. The unlocked PDF can be freely viewed, printed, and edited.",
    howToSteps: [
      { step: "Upload Protected PDF", description: "Select or drag and drop the password-protected PDF." },
      { step: "Enter Password", description: "Enter the PDF password if required." },
      { step: "Unlock & Download", description: "Click Unlock PDF and download the unrestricted file." }
    ],
    faqs: [
      { question: "Can I unlock any PDF?", answer: "This tool works with PDFs that have owner passwords. PDFs with strong encryption may require the correct password." },
      { question: "Is the unlocked PDF identical?", answer: "Yes, all content is preserved. Only the password restriction is removed." }
    ],
    benefits: ["Instant unlock", "Content preserved", "No data stored", "Local processing", "Free forever"],
    relatedTools: ["protect-pdf", "edit-pdf", "merge", "compress"]
  },
  "crop-pdf": {
    metaTitle: "Crop PDF Online Free - Resize PDF Pages | pdfkit.pro",
    metaDescription: "Crop and resize PDF page dimensions online for free. Adjust margins on all sides. No upload, browser-based PDF cropping tool.",
    keywords: ["crop pdf", "resize pdf", "trim pdf", "crop pdf online free", "pdf cropper", "adjust pdf margins"],
    h1: "Crop PDF Pages Online for Free",
    h2Intro: "How to Crop a PDF",
    introParagraph: "Trim unwanted margins and resize your PDF pages with precision. Adjust the crop area on all four sides using intuitive slider controls. Apply the crop to all pages at once for consistent results.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop your PDF file." },
      { step: "Set Margins", description: "Use the sliders to adjust top, bottom, left, and right margins." },
      { step: "Crop & Download", description: "Click Crop PDF and download the trimmed document." }
    ],
    faqs: [
      { question: "Can I crop different margins on each side?", answer: "Yes, each side (top, bottom, left, right) has independent controls." },
      { question: "Does cropping remove content?", answer: "Cropping sets a visible area. Content outside the crop box is hidden but may still exist in the file." }
    ],
    benefits: ["Four-side control", "Visual sliders", "All pages at once", "Precise adjustments", "Free and private"],
    relatedTools: ["rotate", "edit-pdf", "compress", "delete-pages"]
  },
  "chat-with-pdf": {
    metaTitle: "Chat with PDF Online Free - AI PDF Q&A Tool | pdfkit.pro",
    metaDescription: "Chat with your PDF documents using AI. Ask questions, get summaries, find information instantly. No upload to servers, 100% browser-based AI PDF chat.",
    keywords: ["chat with pdf", "ai pdf", "ask pdf questions", "pdf chatbot", "summarize pdf", "chat with pdf online free", "pdf ai reader"],
    h1: "Chat with PDF Using AI - Free Online",
    h2Intro: "How to Chat with Your PDF",
    introParagraph: "Have a conversation with your PDF documents. Upload any PDF and ask questions about its content — get instant summaries, find specific information, count pages and words, or search for any topic. All processing runs locally in your browser with zero data sent to servers.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop any PDF document." },
      { step: "Ask Questions", description: "Type your questions in the chat interface." },
      { step: "Get Answers", description: "Receive instant answers with page references and relevant snippets." }
    ],
    faqs: [
      { question: "Does Chat with PDF use AI?", answer: "It uses smart local text analysis to search, summarize, and answer questions about your PDF content directly in your browser." },
      { question: "Is my PDF uploaded to a server?", answer: "No, all processing happens locally in your browser. Your document never leaves your device." },
      { question: "What kind of questions can I ask?", answer: "Ask for summaries, word counts, page content, search for keywords, find sections, and explore topics within your document." },
      { question: "Does it work with scanned PDFs?", answer: "It works best with text-based PDFs. Scanned image PDFs may not have extractable text." }
    ],
    benefits: ["Instant answers", "Page references", "Smart search", "Document summaries", "100% private"],
    relatedTools: ["extract-text", "pdf-to-word", "edit-pdf", "compress"]
  },
  "edit-pdf": {
    metaTitle: "Edit PDF Online Free - PDF Editor with Text & Images | pdfkit.pro",
    metaDescription: "Edit PDF files online for free. Add text, whiteout content, draw, insert images. Full visual PDF editor. No upload, no signup. Browser-based.",
    keywords: ["edit pdf", "pdf editor", "edit pdf online free", "modify pdf", "change pdf text", "pdf editor online", "free pdf editor"],
    h1: "Edit PDF Online - Free Visual PDF Editor",
    h2Intro: "How to Edit a PDF Document",
    introParagraph: "Edit any PDF document with our powerful visual editor. Add new text with custom fonts and colors, whiteout existing content, draw annotations, and insert images. Navigate between pages, zoom in for precision, and export your edited PDF with all changes baked in. Perfect for editing receipts, invoices, forms, and documents.",
    howToSteps: [
      { step: "Upload PDF", description: "Select or drag and drop the PDF file you want to edit." },
      { step: "Use Editing Tools", description: "Select from Text, Whiteout, Draw, or Image tools to modify your PDF." },
      { step: "Export PDF", description: "Click Export PDF to download your edited document with all changes." }
    ],
    faqs: [
      { question: "Can I edit existing text in a PDF?", answer: "You can whiteout existing text with the Whiteout tool and add new text on top. This works great for editing receipts, invoices, and forms." },
      { question: "What editing tools are available?", answer: "Text (with font size, color, bold, italic), Whiteout (cover content), Draw (freehand), and Image (insert pictures)." },
      { question: "Can I undo my changes?", answer: "Yes, the editor supports 30 levels of undo/redo for all operations." },
      { question: "Are my edits saved in the PDF?", answer: "When you click Export PDF, all your edits are permanently written into the PDF file." }
    ],
    benefits: ["Visual WYSIWYG editor", "Text with formatting", "Whiteout tool", "Image insertion", "30-level undo/redo", "Zoom controls", "Multi-page support"],
    relatedTools: ["sign-pdf", "watermark", "add-page-numbers", "chat-with-pdf"]
  },
};

export function getToolSEO(toolId: string): ToolSEO | undefined {
  return toolSEOData[toolId];
}
