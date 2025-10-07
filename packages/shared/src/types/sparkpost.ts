export interface SparkPostTemplate {
  id: string;
  name: string;
  description?: string;
  published?: boolean;
  content?: {
    subject?: string;
    from?: {
      email?: string;
      name?: string;
    };
  };
}

export interface SparkPostResponse {
  results: SparkPostTemplate[];
}

export interface SparkPostError {
  message: string;
  code?: string;
  description?: string;
}