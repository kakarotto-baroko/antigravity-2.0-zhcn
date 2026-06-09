const fs=require('fs');
const txt=fs.readFileSync('main.js','utf8');
['"Settings"','"General"','"Browser"','"Appearance"'].forEach(word => {
  console.log('--- ' + word);
  let i=0; let m;
  // match word with surrounding context without using literal newlines
  const rx=new RegExp('.{0,40}' + word + '.{0,40}', 'g');
  while((m=rx.exec(txt))!==null){
    if(i++<15) console.log(m[0].replace(/\n/g,' '));
  }
});
