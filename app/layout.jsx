import "../src/index.css";

// Next.js requires route metadata to be exported from a layout module.
// eslint-disable-next-line react-refresh/only-export-components
export const metadata = {
  title: "EduPulse ERP",
  description: "Education management portal for administrators, staff, and students.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
