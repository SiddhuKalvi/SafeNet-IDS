import { createClient as mockCreateClient, createServerClient as mockCreateServerClient } from '@/lib/mock-db'

export const supabase = mockCreateClient('mock', 'mock');
export const createServerClient = () => mockCreateServerClient();
