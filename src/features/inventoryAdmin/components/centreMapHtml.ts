export interface MapCoordinates { latitude: number; longitude: number }
export function validMapCoordinates(value: unknown): value is MapCoordinates {
  if (!value || typeof value !== 'object') return false;
  const point = value as MapCoordinates;
  return typeof point.latitude === 'number' && Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90
    && typeof point.longitude === 'number' && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
}
// Only validated coordinates enter HTML; no account, address or contact data is sent.
export function centreMapHtml(initial: MapCoordinates | null): string {
  const point = validMapCoordinates(initial) ? initial : null;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;margin:0}#status{position:absolute;top:12px;left:55px;right:12px;z-index:1000;background:white;padding:10px;border-radius:8px;font:14px sans-serif} .pin{font-size:32px;color:#ba0826;text-shadow:0 1px 2px white}</style></head><body>
<div id="map"></div><div id="status">Loading map…</div>
<script>
function send(message){var text=JSON.stringify(message);if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(text)}else{window.parent.postMessage(text,'*')}}
function failure(){document.getElementById('status').textContent='Map unavailable. Return to manual entry.';send({type:'error'})}
</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="failure()"></script>
<script>
try {
var initial=${JSON.stringify(point)};
// Sri Lanka overview is a viewport only, never a selected centre.
var map=L.map('map').setView(initial?[initial.latitude,initial.longitude]:[7.8731,80.7718],initial?15:7);
var tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);
var marker=null;
function select(lat,lng){lng=((lng+180)%360+360)%360-180;if(!Number.isFinite(lat)||lat < -90||lat > 90)return;
if(!marker){marker=L.marker([lat,lng],{draggable:true,icon:L.divIcon({className:'pin',html:'&#128205;',iconSize:[32,40],iconAnchor:[16,36]})}).addTo(map);marker.on('dragend',function(){var p=marker.getLatLng();select(p.lat,p.lng)})}else{marker.setLatLng([lat,lng])}
send({type:'selection',latitude:lat,longitude:lng})}
map.on('click',function(event){select(event.latlng.lat,event.latlng.lng)});
if(initial)select(initial.latitude,initial.longitude);
var loaded=false;
tiles.on('tileload',function(){if(!loaded){loaded=true;document.getElementById('status').style.display='none';send({type:'ready'})}});
tiles.on('tileerror',failure);
setTimeout(function(){if(!loaded)failure()},15000);
}catch(error){failure()}
</script></body></html>`;
}
