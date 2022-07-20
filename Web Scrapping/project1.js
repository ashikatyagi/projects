let minimist=require("minimist");
let axios=require("axios");
let jsdom=require("jsdom");
let pdf=require("pdf-lib");
let excel=require("excel4node");
let fs=require("fs");
let path=require("path");
// node project1.js --source="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results" --excel=excelwc.csv --datafolder=data
let args=minimist(process.argv);
let responsepromise=axios.get(args.source);
responsepromise.then(function(response){
    let html=response.data;
    let dom=new jsdom.JSDOM(html);
    let document=dom.window.document;
    let matchinfo=document.querySelectorAll("div.ds-py-3");
    let matchs=[]
    for(let i=0;i<matchinfo.length;i++){
        let match={

        };
        let names=matchinfo[i].querySelectorAll("p.ds-text-tight-m");
        
        match.t1=names[0].textContent;
        match.t2=names[1].textContent;
        let scorespans=matchinfo[i].querySelectorAll("div.ds-text-compact-s>strong");
        match.t1s="";
        match.t2s="";
        if(scorespans.length==2){
        match.t1s=scorespans[0].textContent;
        match.t2s=scorespans[1].textContent;
        }
        else if(scorespans.length==1){
            match.t1s=scorespans[0].textContent;
            match.t2s="";
        }
        else {
            match.t1s="";
            match.t2s="";
        }
        let resultspan=matchinfo[i].querySelector("p.ds-text-tight-s>span");
        match.result=resultspan.textContent;
        matchs.push(match);

    }
    
 let teams=[

 ];
 for(let i=0;i<matchs.length;i++){
 populateteams(teams,matchs[i]);
 

 }
 for(let i=0;i<matchs.length;i++){
   
    populatematchinteams(teams,matchs[i]);
   
    }
 let teamsJSON=JSON.stringify(teams);
 fs.writeFileSync("Teams.json",teamsJSON,"utf-8");
 createexcelfile(teams);
 createfolders(teams);
}).catch(function(err){
    console.log(err);
})
function populateteams(teams,match){
   let t1idx=-1;
   for(let i=0;i<teams.length;i++){
      if(teams[i].name==match.t1){
               t1idx=i;
               break;
      }   }
   
   if (t1idx==-1){
    let team={
        name:match.t1,
        matches:[]
    }
    teams.push(team);
   }
let t2idx=-1
for(let i=0;i<teams.length;i++){
      if(teams[i].name==match.t2){
            t2idx=i;
            break;
        } 
      
   }
   if (t2idx==-1){
    let team={
        name:match.t2,
        matches:[]
    }
    teams.push(team);
   }

}
function populatematchinteams(teams,match){
    let t1idx=-1;
    for(let i=0;i<teams.length;i++){
       if(teams[i].name==match.t1){
                t1idx=i;
                break;
       }   }
      teams[t1idx].matches.push({
        vs:match.t2,
        opponentscore:match.t2s,
        selfscore:match.t1s,
        result:match.result
       }); 
       let t2idx=-1
for(let i=0;i<teams.length;i++){
      if(teams[i].name==match.t2){
            t2idx=i;
            break;
        } 
  
   }
   teams[t2idx].matches.push({
    vs:match.t1,
    opponentscore:match.t1s,
    selfscore:match.t2s,
    result:match.result
   }) ;
}
function createexcelfile(teams){
    let wb=new excel.Workbook()
    for(let i=0;i<teams.length;i++){
        let sheet=wb.addWorksheet(teams[i].name);
        sheet.cell(1,1).string("vs");
        sheet.cell(1,2).string("self score");
        sheet.cell(1,3).string("opponent score");
        sheet.cell(1,4).string("result");
        for(let j=0;j<teams[i].matches.length;j++){
            sheet.cell(j+2,1).string(teams[i].matches[j].vs);
            sheet.cell(j+2,2).string(teams[i].matches[j].selfscore);
            sheet.cell(j+2,3).string(teams[i].matches[j].opponentscore);
            sheet.cell(j+2,4).string(teams[i].matches[j].result);
        }
    }
    wb.write(args.excel);
}
function createfolders(teams){
    fs.mkdirSync(args.datafolder);
    for(let i=0;i<teams.length;i++){
        let teamFN=path.join(args.datafolder,teams[i].name);
        fs.mkdirSync(teamFN);
        for(let j=0;j<teams[i].matches.length;j++){
            let matchFN=path.join(teamFN,teams[i].matches[j].vs+".pdf");
            createscorecard(teams[i].name,teams[i].matches[j],matchFN);
        }
    }
}
function createscorecard(teamname,matches,filename){
    let t1=teamname;
    let t2=matches.vs;
    let t1s=matches.selfscore;
    let t2s=matches.opponentscore;
    let result=matches.result;
    let bytesoftemplate=fs.readFileSync("template.pdf");
    let bytesloadpromise=pdf.PDFDocument.load(bytesoftemplate);
    bytesloadpromise.then(function(pages){
        let page=pages.getPage(0);
        page.drawText(t1,{
            x:320,
            y:687,
            size:10
        });
        page.drawText(t2,{
            x:320,
            y:667,
            size:10
        });
        page.drawText(t1s,{
            x:320,
            y:647,
            size:10
        });
        page.drawText(t1s,{
            x:320,
            y:627,
            size:10
        });
        page.drawText(result,{
            x:320,
            y:608,
            size:10
        });
        let promisetosave=pages.save();
        promisetosave.then(function(finalbytes){
            fs.writeFileSync(filename,finalbytes);
        })
    })
    
}
     
  
