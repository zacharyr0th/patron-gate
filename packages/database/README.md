# @repo/database

Database package for PatronGate - Neon Postgres with Drizzle ORM.

## Features

- Type-safe database queries with Drizzle ORM
- Neon Postgres serverless driver
- Content service for storage operations
- Database migrations with schema versioning

## Schema

### Content Table

The `content` table stores creator-uploaded content metadata:

**Storage & Identity:**
- `id` - Unique content identifier
- `creatorId` - Creator identifier
- `creatorWallet` - Creator's Aptos wallet address

**Content Metadata:**
- `title` - Content title
- `description` - Content description
- `contentType` - Type: video, audio, image, document
- `fileSize` - File size in bytes
- `duration` - Duration in seconds (for media)
- `thumbnailUrl` - Thumbnail URL

**Storage (Shelby Protocol):**
- `shelbyCID` - Content identifier on Shelby
- `shelbyBlobUrl` - Direct blob URL for retrieval
- `shelbyChunksetId` - Chunkset identifier (optional)
- `sessionIdUsedForUpload` - Upload session ID (optional)

**Analytics:**
- `streamCount` - Number of times accessed
- `uploadedAt` - Upload timestamp
- `updatedAt` - Last update timestamp

## Services

### ContentService

Type-safe service for content operations:

```typescript
import { ContentService } from "@repo/database/services/content";

// Create content
await ContentService.create({
  id: "content_123",
  creatorWallet: "0x...",
  title: "My Video",
  contentType: "video",
  fileSize: 1024000,
  shelbyCID: "cid_...",
  shelbyBlobUrl: "https://...",
  // ... other fields
});

// Get content
const content = await ContentService.get("content_123");

// List all content
const allContent = await ContentService.list();

// Update content
await ContentService.update("content_123", {
  streamCount: content.streamCount + 1
});

// Delete content
await ContentService.delete("content_123");
```

## Database Setup

### Environment Variables

```bash
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

### Running Migrations

**Generate migration:**
```bash
cd packages/database
bun drizzle-kit generate
```

**Apply migration:**
```bash
cd packages/database
bun run migrate
```

**Push schema changes (development only):**
```bash
cd packages/database
bun drizzle-kit push
```

## Development

### Type Generation

Types are automatically generated from Drizzle schema:

```bash
# Generate types
bun drizzle-kit generate
```

### Database Inspection

```bash
# Open Drizzle Studio
bun drizzle-kit studio
```

## Usage in Next.js

```typescript
import { ContentService } from "@repo/database/services/content";

export async function GET() {
  const content = await ContentService.list();
  return Response.json(content);
}

export async function POST(request: Request) {
  const body = await request.json();
  await ContentService.create(body);
  return Response.json({ success: true });
}
```

## Architecture

- **ORM**: Drizzle (type-safe, edge-compatible)
- **Database**: Neon Postgres (serverless, autoscaling)
- **Migration**: Drizzle Kit (schema versioning)
- **Service Layer**: ContentService (abstraction over Drizzle)

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Neon Postgres Docs](https://neon.tech/docs)
- [Shelby Protocol Docs](https://geomi.dev)
