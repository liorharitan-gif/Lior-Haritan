import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req) => {
  // 1. Setup Supabase Client
  // strictly use Service Role Key to bypass RLS for the lookup
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 2. Get User from Request (Auth Header)
  const authHeader = req.headers.get('Authorization')!
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // 3. Parse Input
  const { inviteCode } = await req.json()

  try {
    // 4. Find Family by Code
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .select('id')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()

    if (familyError || !family) {
      return new Response(JSON.stringify({ error: 'קוד הזמנה שגוי' }), { status: 404 })
    }

    // 5. Check constraints (Max 2 parents)
    const { count, error: countError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', family.id)

    if (count && count >= 2) {
      return new Response(JSON.stringify({ error: 'המשפחה מלאה (מקסימום 2 הורים)' }), { status: 400 })
    }

    // 6. Update User Profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ family_id: family.id, role: 'invited' })
      .eq('id', user.id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ message: 'הצטרפת למשפחה בהצלחה!', familyId: family.id }),
      { headers: { "Content-Type": "application/json" } },
    )

  } catch (err) {
    return new Response(JSON.stringify({ error: 'שגיאה בשרת' }), { status: 500 })
  }
})