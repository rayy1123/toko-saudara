import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project-id.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

/**
 * Public Supabase client for client-side operations (anonymous / user queries, storage downloads)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

/**
 * Admin Supabase client with service role key for privileged backend operations (storage uploads, server maintenance)
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Helper to upload image to Supabase Storage bucket 'toko-saudara'
 */
export async function uploadProductImage(file: Blob, fileName: string): Promise<string | null> {
  try {
    const bucket = "toko-saudara";
    const path = `products/${Date.now()}-${fileName}`;

    const { data, error } = await supabaseAdmin.storage.from(bucket).upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Failed to upload to Supabase storage:", err);
    return null;
  }
}
