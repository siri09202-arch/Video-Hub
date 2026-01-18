import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import VideoCard from "../components/VideoCard";
import Link from "next/link";

export default function Home() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    async function load() {
      const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVideos(items);
    }
    load();
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h1>YouTube風 MVP</h1>
        <div>
          <Link href="/upload"><a className="button">動画をアップロード</a></Link>
        </div>
      </div>

      {videos.length === 0 && <div className="card">まだ動画がありません。まずはアップロードしてみてください。</div>}
      {videos.map(v => <VideoCard key={v.id} video={v} />)}
    </div>
  );
}
