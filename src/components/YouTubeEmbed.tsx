'use client'

import React from 'react'

interface YouTubeEmbedProps {
  url: string
  title?: string
  description?: string
}

export default function YouTubeEmbed({ url, title, description }: YouTubeEmbedProps) {
  // Extract video ID from URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const videoId = getYouTubeId(url)

  if (!videoId) {
    return (
      <div className="my-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        Invalid YouTube URL: {url}
      </div>
    )
  }

  return (
    <figure className="my-10 w-full max-w-4xl mx-auto">
      <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
        <iframe
          className="absolute top-0 left-0 w-full h-full border-0"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title || 'YouTube Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        ></iframe>
      </div>
      {(title || description) && (
        <figcaption className="mt-4 px-2">
          {title && (
            <div className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
              {title}
            </div>
          )}
          {description && (
            <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
              {description}
            </div>
          )}
        </figcaption>
      )}
    </figure>
  )
}
