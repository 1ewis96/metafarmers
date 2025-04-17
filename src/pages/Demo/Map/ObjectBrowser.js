import React, { useEffect, useState } from "react";
import { ProgressBar, Card, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const ObjectBrowser = () => {
  const [objects, setObjects] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadedSprites, setLoadedSprites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const res = await fetch("https://api.metafarmers.io/list/objects");
        const data = await res.json();
        const objectIds = data.objects;

        let loaded = [];
        let completed = 0;

        for (const id of objectIds) {
          const objectRes = await fetch(`https://api.metafarmers.io/object/${id}`);
          const objectData = await objectRes.json();

          const img = new Image();
          img.src = objectData.spriteSheet.url;

          await new Promise((resolve) => {
            img.onload = () => {
              completed++;
              setLoadingProgress(Math.round((completed / objectIds.length) * 100));
              loaded.push({ id, img, meta: objectData });
              resolve();
            };
            img.onerror = resolve;
          });
        }

        setLoadedSprites(loaded);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading objects:", err);
      }
    };

    fetchObjects();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      {isLoading ? (
        <>
          <h5>Loading objects...</h5>
          <ProgressBar now={loadingProgress} label={`${loadingProgress}%`} animated />
        </>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {loadedSprites.map(({ id, img }) => (
            <Card key={id} style={{ width: 100, textAlign: "center" }}>
              <Card.Img variant="top" src={img.src} style={{ objectFit: "contain", height: 80 }} />
              <Card.Body style={{ padding: 5 }}>
                <small>{id}</small>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ObjectBrowser;
