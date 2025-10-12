'use client'

import SimpleSearch from './SimpleSearch'

export default function HomeSearch() {
  return (
    <div className="pb-12">
      <SimpleSearch placeholder="記事を検索（例: 夜勤、給料、転職）" />
    </div>
  )
}
