export type SecretSummary = {
  _id: string;
  userId: string;
  label: string;
};

export type SecretDetail = {
  _id: string;
  userId: string;
  label: string;
  data: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
