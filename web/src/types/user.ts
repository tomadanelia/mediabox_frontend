export interface Account {
  id: string; 
  user_id: string; 
  balance: string; 
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string; 
  username: string;
  full_name: string | null; 
  email: string | null;
  phone: string | null; 
  avatar_url: string | null; 
  role: 'user' | 'admin'; 
    email_verified_at: string | null; 
  phone_verified_at: string | null;
  numeric_id:string;
  created_at: string;
  updated_at: string;
  account?: Account | null; 
}