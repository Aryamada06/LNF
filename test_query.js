const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hthscnnexfxvvtuenymo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aHNjbm5leGZ4dnZ0dWVueW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0Mzk3NzcsImV4cCI6MjA5NDAxNTc3N30.FKpFRXDu8SFlPbKQZv_jPbwpoPQJBO5jPkUt2UqzKQ8'
);

async function runQuery() {
  const { data: item, error } = await supabase
    .from('items')
    .select('title, image_url')
    .order('created_at', { ascending: false })
    .limit(1)

  console.log('Result:', { item, error })
}

runQuery();
