import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../lib/axiosInstance";

interface Station {
  역번호: number;
  역명: string;
  위도: number;
  경도: number;
  도시: string;
  노선: string;
}

interface CongestionEntry {
  avg: number;
  congestion: number;
}

interface CongestionData {
  [stationName: string]: {
    [time: string]: CongestionEntry;
  };
}

// 지도 크기 강제 갱신
function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

export default function SubwayMapApp() {
  const [stations, setStations] = useState<Station[]>([]);
  const [congestion, setCongestion] = useState<CongestionData>({});
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stationRes, congestionRes] = await Promise.all([
          api.get("/stations/location"),
          api.get("/stations/congestion/all"),
        ]);
        setStations(stationRes.data.data || []);
        setCongestion(congestionRes.data.data || {});
        const firstStation = Object.values(congestionRes.data.data)[0];
        if (firstStation) {
          setSelectedTime(Object.keys(firstStation)[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p style={{ padding: 16 }}>데이터 불러오는 중...</p>;
  if (!stations.length || !Object.keys(congestion).length)
    return <p style={{ padding: 16, color: "red" }}>데이터가 없습니다.</p>;

  const timeKeys = Object.keys(Object.values(congestion)[0] || {});

  // 색상 계산
  const getColor = (v: number) => {
    if (v >= 0.7) return "#e74c3c"; // 높음
    if (v >= 0.4) return "#f1c40f"; // 보통
    if (v > 0) return "#2ecc71";     // 낮음
    return "#bdc3c7";                // 0
  };

  // 반경 계산
  const getRadius = (v: number) => 6 + v * 20;

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {/* 지도 */}
      <MapContainer center={[35.1796, 129.0756]} zoom={11} style={{ width: "100%", height: "100%" }}>
        <ResizeMap />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stations.map((station) => {
          const info = congestion[station.역명]?.[selectedTime];
          const c = info?.congestion ?? 0;
          const avg = info?.avg ?? 0;
          return (
            <CircleMarker
              key={station.역번호 + "-" + selectedTime} // 시간대 바뀌면 재렌더링
              center={[station.위도, station.경도]}
              radius={getRadius(c)}
              fillOpacity={0.85}
              color="#3e3e3eff"           // 테두리 색
              fillColor={getColor(c)} // 내부 색
            >
              <Popup>
                <strong>{station.역명}</strong> ({station.노선})
                <br />
                시간대: {selectedTime}
                <br />
                평균 이용객: {avg.toLocaleString()}명
                <br />
                혼잡도: {c.toFixed(2)}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* 시간대 슬라이더 */}
      {timeKeys.length > 0 && (
        <div style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(255,255,255,0.9)",
          borderRadius: 12,
          padding: "12px 16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          border: "1px solid #ccc",
          textAlign: "center",
          zIndex: 1000
        }}>
          <input
            type="range"
            min={0}
            max={timeKeys.length - 1}
            value={timeKeys.indexOf(selectedTime)}
            onChange={(e) => setSelectedTime(timeKeys[Number(e.target.value)])}
            style={{ width: 288 }}
          />
          <div style={{ marginTop: 8, fontWeight: 600, fontSize: 14, color: "#333" }}>
            시간대: {selectedTime}
          </div>
        </div>
      )}

      {/* 범례 */}
      <div style={{
        position: "absolute",
        top: 24,
        right: 24,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 12,
        padding: "12px 16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        border: "1px solid #ccc",
        zIndex: 1000
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>혼잡도</div>
        {[
          { label: "낮음", color: "#2ecc71" },
          { label: "보통", color: "#f1c40f" },
          { label: "높음", color: "#e74c3c" },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
            <div style={{ width: 16, height: 16, marginRight: 8, borderRadius: 4, backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
