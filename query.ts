import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yluoxqepusebwxbocndl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdW94cWVwdXNlYnd4Ym9jbmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNTU1ODIsImV4cCI6MjA4NDgzMTU4Mn0.q8R4qJocLeFk3_2BP8Z6CXoa9D1ItrIHopt1JpzF5WQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const query = await supabase.from('orders').select('status');
  const statuses = new Set(query.data?.map(d => d.status));
  console.log('All existing statuses:', statuses);
}
run();
