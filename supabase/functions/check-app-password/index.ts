import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckPasswordRequest {
  password: string;
}

interface LoginAttempt {
  ip_address: string;
  attempt_time: string;
  success: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for brute force protection
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Initialize Supabase client with service role key for database access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check for brute force attempts
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentAttempts, error: attemptsError } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('ip_address', clientIP)
      .gte('attempt_time', fiveMinutesAgo);

    if (attemptsError) {
      console.error('Error checking login attempts:', attemptsError);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Count failed attempts in the last 5 minutes
    const failedAttempts = recentAttempts?.filter(attempt => !attempt.success).length || 0;
    
    if (failedAttempts >= 5) {
      console.log(`Too many failed attempts from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many failed attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { password }: CheckPasswordRequest = await req.json();

    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the stored password hash from app_passwords table
    const { data: passwordData, error: passwordError } = await supabase
      .from('app_passwords')
      .select('password_hash, salt')
      .limit(1)
      .maybeSingle();

    if (passwordError) {
      console.error('Error fetching password:', passwordError);
      await logAttempt(supabase, clientIP, false);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let isValid = false;

    if (!passwordData) {
      // No password set yet, use default password "admin" for initial setup
      isValid = password === 'admin';
      
      if (isValid) {
        // Hash and store the provided password for future use
        const salt = crypto.randomUUID();
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const { error: insertError } = await supabase
          .from('app_passwords')
          .insert({
            password_hash: hashHex,
            salt: salt
          });

        if (insertError) {
          console.error('Error storing password hash:', insertError);
        }
      }
    } else {
      // Verify against stored hash
      const encoder = new TextEncoder();
      const data = encoder.encode(password + passwordData.salt);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      isValid = hashHex === passwordData.password_hash;
    }

    // Log the attempt
    await logAttempt(supabase, clientIP, isValid);

    if (isValid) {
      // Create session token
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const { error: sessionError } = await supabase
        .from('app_sessions')
        .insert({
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        });

      if (sessionError) {
        console.error('Error creating session:', sessionError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionToken: sessionToken,
          expiresAt: expiresAt.toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function logAttempt(supabase: any, ipAddress: string, success: boolean) {
  try {
    await supabase
      .from('login_attempts')
      .insert({
        ip_address: ipAddress,
        success: success
      });
  } catch (error) {
    console.error('Error logging attempt:', error);
  }
}