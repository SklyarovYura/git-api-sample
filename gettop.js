
const https             = require('https');
const url               = require('url');
const country           = process.argv[2] || 'Ukraine';
const size              = parseInt(process.argv[3]) || 10;
const followers         = [];
const repositories      = [];

const top_repositories       = new Array(size).fill(0);
const html_top_repositories  = new Array(size).fill('');


requestHandler(`https://api.github.com/search/users?q=repos:>=1+location:${country}&sort=followers&order=desc`)
        .then((data)=>{
            let source = null;
            let load   = [];
            try{
                source = JSON.parse(data.toString('utf-8'));

                for(let i=0; i<size; i++){
                    followers.push( source.items[i].url );
                    repositories.push(source.items[i].repos_url);
                }

                repositories.forEach((url_string)=>{ 
                    load.push(requestHandler(url_string)); 
                });
            }
            catch(err){
                errorHander(err);
            }

            Promise.all(load)
                    .then((values)=>{
                        let user_repositories = [];
                        
                        values.forEach((data)=>{
                            try{
                                user_repositories.push(JSON.parse(data.toString()));
                            }
                            catch(err){
                                errorHander(err);
                            }
                        });

                        user_repositories.forEach((list)=>{
                            list.forEach((repository)=>{
                                for(let i=0; i<size; i++){
                                    if(repository.stargazers_count>top_repositories[i]){

                                        if(i+1<size)
                                            top_repositories.copyWithin(i+1,i);

                                        top_repositories[i] = repository.stargazers_count;

                                        if(i+1<size)
                                            html_top_repositories.copyWithin(i+1,i);

                                        html_top_repositories[i] = repository.html_url;
                                        break;
                                    }
                                }
                            });
                        });

                        console.log(html_top_repositories);

                    })
                    .catch(errorHander);
        })
        .catch(errorHander);

function requestHandler(url_string){
    return new Promise((resolve,reject)=>{

        let objURL = url.parse(url_string);

        let options = {
            method:'GET',
            protocol:objURL.protocol,
            hostname:objURL.hostname,
            path:objURL.path,
            port: 443,
            headers:{ 'User-Agent': 'Mozilla'  }
        }


        https.request(options,
        (res)=>{
            
                let data = Buffer.alloc(0);

                res.on('data',(chunk)=>{
                    data = Buffer.concat([data,chunk]);
                });

                res.on('error',(err)=>{
                    reject(err);
                });

                res.on('end',()=>{
                    if(res.statusCode===200){
                        resolve(data);
                    }
                    else{
                        reject(new Error(`Response message: \n${data.toString()}`));
                    }
                });

        }).on('error',(err)=>{
            errorHander(err);
        }).end();

    });
}

function errorHander(err){
     console.log(err);
}