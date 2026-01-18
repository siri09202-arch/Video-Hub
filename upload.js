import { useState } from "react";
import { storage, db } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/router";

async function captureThumbnail(file) {
  // 動画ファイルから1フレームをキャプチャして dataURL を返す
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.currentTime = 1;
    video.addEventListener("loadeddata", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 270;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toDataURL("image/jpeg", 0.8);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    });
    video.addEventListener("error", (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    });
  });
}

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("動画を選択してください");

    try {
      // サムネイ���をキャプチャ（失敗したらスキップ）
      let thumbnailDataUrl = null;
      try {
        thumbnailDataUrl = await captureThumbnail(file);
      } catch (err) {
        console.warn("サムネイル生成失敗:", err);
      }

      // 動画アップロード
      const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on("state_changed",
        (snapshot) => {
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(pct));
        },
        (err) => { console.error(err); alert("アップロー���失敗"); },
        async () => {
          const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // サムネイルがあれば Storage に保存
          let thumbnailUrl = "";
          if (thumbnailDataUrl) {
            const buf = await (await fetch(thumbnailDataUrl)).arrayBuffer();
            const blob = new Blob([buf], { type: "image/jpeg" });
            const thumbRef = ref(storage, `thumbnails/${Date.now()}_thumb.jpg`);
            await uploadBytesResumable(thumbRef, blob);
            thumbnailUrl = await getDownloadURL(thumbRef);
          }

          // Firestore にメタデータを保存
          const doc = await addDoc(collection(db, "videos"), {
            title: title || "",
            videoUrl,
            thumbnailUrl,
            createdAt: serverTimestamp()
          });

          router.push(`/watch/${doc.id}`);
        }
      );
    } catch (err) {
      console.error(err);
      alert("エラーが発生しました");
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h2>動画をアップロード</h2>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: 8}}>
            <label>タイトル</label><br />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" style={{width:"100%", padding:8}} />
          </div>
          <div style={{marginBottom: 8}}>
            <label>動画ファイル</label><br />
            <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <div style={{marginBottom: 8}}>
            <button className="button" type="submit">アップロード</button>
            <span style={{marginLeft:12}} className="small">進捗: {progress}%</span>
          </div>
        </form>
      </div>
    </div>
  );
}
