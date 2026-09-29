import {cp,mkdir,rm,readFile,stat} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const web=new URL('web/',root),dist=new URL('dist/',root);
for(const file of ['index.html','style.css','app.js','sw.js','manifest.webmanifest','assets/radio.png','assets/icon-180.png','assets/icon-192.png','assets/icon-512.png']){
 if(!(await stat(new URL(file,web))).isFile())throw Error('Missing '+file);
}
const manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',web),'utf8'));
if(manifest.scope!=='./'||manifest.start_url!=='./')throw Error('GitHub Pages relative paths required');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});await cp(web,dist,{recursive:true});
console.log('Ready: dist/');
