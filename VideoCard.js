import Link from "next/link";

export default function VideoCard({ video }) {
  return (
    <div className="card">
      <Link href={`/watch/${video.id}`}>
        <a>
          <img src={video.thumbnailUrl || "/placeholder.png"} alt={video.title} className="video-thumb" />
        </a>
      </Link>
      <h3 style={{margin: "8px 0"}}>{video.title || "無題��動画"}</h3>
      <div className="small">アップロード: {new Date(video.createdAt?.toMillis?.() || video.createdAt || Date.now()).toLocaleString()}</div>
    </div>
  );
}
