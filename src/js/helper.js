import Rx from 'rx';

const SEARCH_REPOS = 'https://api.github.com/search/repositories?sort=stars&order=desc&q=';
const TOKEN = '2bee368c8ad1326b8c28fd9818b1cb5d4e34eadf';
const getReposPromise = query => {
    return $.ajax({
        type: 'GET',
        url: `${SEARCH_REPOS}${query}`
    }).promise();
}

const getUserPromise = data => {
    const { url, conatiner } = data;
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `${url}?access_token=${TOKEN}`,
            success: (data) => {
                resolve({
                    conatiner,
                    data
                });
            },
            error: err => {
                reject(null);
            }
        })
    })
}

export const getRepos = query => {
    const promise = getReposPromise(query);
    return Rx.Observable.fromPromise(promise); 
}
export const getUser = data => {
    const promise = getUserPromise(data);
    return Rx.Observable.fromPromise(promise);
}