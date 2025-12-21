import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wdtzyhtmrpbsrxycsqrf.supabase.co',
  process.env.SUPABASE_DEV_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TEST_USER_IDS = [
  '607fb921-5ca8-418d-8ece-d15638f2a313',
  '9904c707-344b-46fd-9778-bd69491695d8',
  '5e41e8c1-a448-432c-9e9d-58df9a6dbf68',
  '206fc2bf-f29e-4b11-a010-c978fe55b9d9',
  '26dda1c2-8db4-411a-b890-764d7c3cdedc',
  '05f64bb3-bc72-41f4-8212-d66c3648ca72',
  '3f5b30dd-3402-4258-b47b-ded194209d81',
  '4711f073-e6ce-4e96-b5c6-bfb61bcd6352',
  '57875f06-c087-4610-b408-e395701341f3',
  '52b5be3a-2e8b-46f9-9bb6-29bef3a182e8',
  '17853330-d9b7-481e-b844-1c57ec94ae3b',
  '7a37f167-5dc5-4607-9e49-cd43368e91be',
  'dace0443-9b31-4456-bccf-b1ed3e306a5f',
  '5f47f453-3eb7-42ae-bfef-64054faae78e',
  '5826f2bf-2dc3-44d9-bd97-af49732f820e',
  '609e0392-0eaa-4aaa-83ab-797901ed1032',
  '45c29874-2b7e-430b-9731-52ad44558fc4',
];

async function main() {
  console.log(`Deleting ${TEST_USER_IDS.length} test users...`);
  let deleted = 0;
  for (const id of TEST_USER_IDS) {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) console.error('Failed:', id, error.message);
    else { console.log('Deleted:', id); deleted++; }
  }
  console.log('Done! Deleted:', deleted);
}

main();
