export function validateDocument(document: string): boolean {
  const cleanDoc = document.replace(/\D/g, '');
  return cleanDoc.length === 11 || cleanDoc.length === 14;
}
