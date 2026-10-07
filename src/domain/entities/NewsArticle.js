export class NewsArticle {
  constructor({ id, title, body, image, category, pinned, publishedAt, createdAt, updatedAt }) {
    this.id = id
    this.title = title
    this.body = body
    this.image = image ?? null
    this.category = category
    this.pinned = !!pinned
    this.publishedAt = publishedAt
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}
