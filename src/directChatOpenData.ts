import type{ChatMessage}from'./chat.ts';
export type OpenMarker={throughMessageId:string;throughCreatedAt:{seconds:number;nanoseconds:number}};
function valid(t?:OpenMarker['throughCreatedAt']){return !!t&&Number.isSafeInteger(t.seconds)&&t.seconds>=0&&Number.isInteger(t.nanoseconds)&&t.nanoseconds>=0&&t.nanoseconds<1e9;}
export function newerOpenMarker(a:OpenMarker|null,b:OpenMarker|null){return !!a&&valid(a.throughCreatedAt)&&(!b||!valid(b.throughCreatedAt)||a.throughCreatedAt.seconds>b.throughCreatedAt.seconds||a.throughCreatedAt.seconds===b.throughCreatedAt.seconds&&a.throughCreatedAt.nanoseconds>b.throughCreatedAt.nanoseconds);}
export function latestOpenMarker(rows:ChatMessage[]):OpenMarker|null{let latest:OpenMarker|null=null;for(const row of rows){if(!valid(row.createdAt)||!row.id)continue;const next={throughMessageId:row.id,throughCreatedAt:row.createdAt!};if(newerOpenMarker(next,latest))latest=next;}return latest;}
export function shouldShareOpen(own:OpenMarker|null,latest:OpenMarker|null,visible:boolean,ready:boolean){return ready&&visible&&!!own&&newerOpenMarker(latest,own);}
export function openMarkerLabel(marker:OpenMarker|null){return marker&&valid(marker.throughCreatedAt)?new Date(marker.throughCreatedAt.seconds*1000+marker.throughCreatedAt.nanoseconds/1e6).toLocaleString('en-NG',{timeZone:'Africa/Lagos'}):'Not available';}
