export type Branch = {
  id: string;
  name: string;
};

export type Book = {
  id: number;
  title: string;
  subject: string;
  cover: string;
  pdfUrl: string;
  branch: string;
  author?: string;
};
