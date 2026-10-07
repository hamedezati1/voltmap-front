import { pool } from '../../../infrastructure/database/pool.js'
import { NewsArticle } from '../../../domain/entities/NewsArticle.js'

function toEntity(row) {
  if (!row) return null
  return new NewsArticle({
    id: row.id,
    title: row.title,
    body: row.body,
    image: row.image,
    category: row.category,
    pinned: Boolean(row.pinned),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

export class MyNewsRepository {
  constructor(executor = pool) {
    this.executor = executor
  }

  async findAll() {
    const { rows } = await this.executor.query(
      'SELECT * FROM news ORDER BY pinned DESC, published_at DESC'
    )
    return rows.map(toEntity)
  }

  async findById(id) {
    const { rows } = await this.executor.query('SELECT * FROM news WHERE id = ?', [id])
    return toEntity(rows[0])
  }

  async create({ title, body, image, category, pinned = false }) {
    const result = await this.executor.query(
      `INSERT INTO news (title, body, image, category, pinned) VALUES (?,?,?,?,?)`,
      [title, body, image ?? null, category ?? null, pinned ? 1 : 0]
    )
    return this.findById(result.insertId)
  }

  async update(id, changes) {
    const allowed = ['title', 'body', 'image', 'category', 'pinned']
    const fields = []
    const values = []
    for (const key of allowed) {
      if (changes[key] === undefined) continue
      fields.push(`${key} = ?`)
      values.push(key === 'pinned' ? (changes[key] ? 1 : 0) : changes[key])
    }
    if (fields.length === 0) return this.findById(id)
    values.push(id)
    await this.executor.query(`UPDATE news SET ${fields.join(', ')} WHERE id = ?`, values)
    return this.findById(id)
  }

  async delete(id) {
    await this.executor.query('DELETE FROM news WHERE id = ?', [id])
    return true
  }
}
