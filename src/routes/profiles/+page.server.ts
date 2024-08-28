import { error } from '@sveltejs/kit';
import { createPool } from '@vercel/postgres';
import { POSTGRES_URL } from '$env/static/private';

export async function load() {
  const db = createPool({ connectionString: POSTGRES_URL });

  try {
    const { rows: names } = await db.query('SELECT * FROM names');
    return { names };
  } catch (err) {
    console.log('Table does not exist, creating and seeding it with dummy data now...');
    // Table is not created yet
    await seed();
    const { rows: names } = await db.query('SELECT * FROM names');
    return { names };
  }
}

async function seed() {
  const db = createPool({ connectionString: POSTGRES_URL });
  const client = await db.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS names (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Created "names" table');

    await Promise.all([
      client.query(`
        INSERT INTO names (name, email)
        VALUES ('Rohan', 'rohan@tcl.com')
        ON CONFLICT (email) DO NOTHING;
      `),
      client.query(`
        INSERT INTO names (name, email)
        VALUES ('Rebecca', 'rebecca@tcl.com')
        ON CONFLICT (email) DO NOTHING;
      `),
      client.query(`
        INSERT INTO names (name, email)
        VALUES ('Vivek', 'vivek@gmail.com')
        ON CONFLICT (email) DO NOTHING;
      `),
    ]);

    console.log('Seeded users');
  } finally {
    client.release();
  }
}

/** @type {import('./$types').Actions} */
export const actions = {
  update: async ({ request }) => {
    const data = await request.formData();
    const db = createPool({ connectionString: POSTGRES_URL });
    const client = await db.connect();

    try {
      const id = data.get('id');
      const newEmail = data.get('email');
      const newName = data.get('name');

      await client.query(`
        UPDATE names
        SET email = ${newEmail}, name = ${newName}
        WHERE id = ${id};
      `);

      return { success: true };
    } finally {
      client.release();
    }
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const db = createPool({ connectionString: POSTGRES_URL });
    const client = await db.connect();

    try {
      const id = data.get('id');

      await client.query(`
        DELETE FROM names
        WHERE id = ${id};
      `);

      return { success: true };
    } finally {
      client.release();
    }
  },

  create: async ({ request }) => {
    const data = await request.formData();
    const db = createPool({ connectionString: POSTGRES_URL });
    const client = await db.connect();

    try {
      const email = data.get('email');
      const name = data.get('name');

      await client.query(`
        INSERT INTO names (name, email)
        VALUES (${name}, ${email})
        ON CONFLICT (email) DO NOTHING;
      `);

      return { success: true };
    } finally {
      client.release();
    }
  }
};