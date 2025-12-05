"use client";

import Link from "next/link";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface ContentCardProps {
  content: {
    id: string;
    title: string;
    description?: string;
    contentType: string;
    thumbnailUrl?: string;
    viewCount: number;
    streamCount: number;
    tierRequirement?: number;
    isPublic: boolean;
    uploadedAt: string;
  };
}

export function ContentCard({ content }: ContentCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatType = (type: string) => {
    return type.split("/")[0].toUpperCase();
  };

  return (
    <Link href={`/content/${content.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        {content.thumbnailUrl ? (
          <div className="h-48 overflow-hidden rounded-t-xl">
            <img
              src={content.thumbnailUrl}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-xl flex items-center justify-center">
            <span className="text-4xl text-muted-foreground">
              {formatType(content.contentType)}
            </span>
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1">{content.title}</CardTitle>
            <div className="flex gap-1 shrink-0">
              <Badge variant="secondary">{formatType(content.contentType)}</Badge>
              {content.isPublic && <Badge>Public</Badge>}
              {content.tierRequirement && (
                <Badge variant="outline">Tier {content.tierRequirement}+</Badge>
              )}
            </div>
          </div>
          <CardDescription className="line-clamp-2">
            {content.description || "No description"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{content.viewCount} views</span>
            <span>{content.streamCount} streams</span>
            <span>{formatDate(content.uploadedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
