import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import Link from "next/link";

export default function WatchPage() {
  const router = useRouter();
  const { id } = router.query;
  const [video, setVideo] = useState(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const d = await getDoc(doc(db, "videos", id));
      if (!d.exists()) {
        setVideo(null);
        return;
      }
      const data = { id: d.id, ...d.data() };
      setVideo(data);

      // 再生数をインクリメント（簡易）
      try {
        await updateDoc(doc(db, "videos", id), { views: increment(1) });
      } catch (e) { /* ignore permission errors */ }
    }
    load();
  }, [id]);

  if (!video) return <div className="container"><div className="card">読み込み中...</div></div>;

  return (
    <div className="container">
      <div className="header">
        <div>
          <Link href="/"><a>← フィードに戻る</a></Link>
        </div>
      </div>

      <div className="card">
        <h2>{video.title || "無題の動画"}</h2>
        <video controls style={{width:"100%", borderRadius:8}} src={video.videoUrl} />
        <div className="small" style={{marginTop:8}}>再生数: {video.views || 0}</div>
      </div>
    </div>
  );
}
