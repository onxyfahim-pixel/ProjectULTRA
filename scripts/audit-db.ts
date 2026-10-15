import mysql from 'mysql2/promise';

async function audit() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'garments_erp'
    });

    console.log('=== MYSQL GARMENTS_ERP AUDIT REPORT ===');
    const [tables]: any = await conn.query('SHOW TABLES');
    const tableNames: string[] = tables.map((t: any) => Object.values(t)[0] as string);
    console.log('Total Tables in garments_erp:', tableNames.length);

    console.log('\n--- TABLE SUMMARY & ROW COUNTS ---');
    for (const t of tableNames) {
      const [cnt]: any = await conn.query(`SELECT COUNT(*) as cnt FROM \`${t}\``);
      console.log(`Table [${t}]: ${cnt[0].cnt} rows`);
    }

    console.log('\n--- MODULE_STORE KEYS PERSISTED IN MYSQL ---');
    const [modRows]: any = await conn.query('SELECT module_key, LENGTH(data) as bytes, updated_at FROM module_store ORDER BY module_key ASC');
    console.log(`Total module keys in module_store: ${modRows.length}`);
    for (const m of modRows) {
      console.log(` * ${m.module_key} (${m.bytes} bytes, updated: ${m.updated_at})`);
    }

    console.log('\n--- BUYER_ORDERS COLUMNS & TYPES ---');
    const [boCols]: any = await conn.query('DESCRIBE buyer_orders');
    for (const c of boCols) {
      console.log(` - ${c.Field}: ${c.Type} (Null: ${c.Null})`);
    }

    console.log('\n--- ATTACHMENTS TABLE STATUS ---');
    const hasAttachmentsTable = tableNames.includes('attachments');
    console.log('Attachments table exists:', hasAttachmentsTable);

    await conn.end();
  } catch (err: any) {
    console.error('Audit failed:', err.message);
  }
}

audit();
