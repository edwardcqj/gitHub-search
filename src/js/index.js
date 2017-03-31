import  Rx  from 'rx';

import { getRepos, getUser } from './helper';
require('../css/base.css');
const reposTemplate = (repos) => {
  
  const { owner } = repos;
  return `
    <div class="repos_item">
    <div class="repos_item_wrapper">
      <div class="repos_user_container">
        <div class="user_header_container">
          <img data-api="${owner.url}" class="user_header" src="${owner.avatar_url}"/>
          <div class="user_infos_container">
            <div class="user_infos_wrapper">
              <div class="info_loading">
                <i aria-hidden="true" class="fa fa-spinner fa-spin"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="user_info">
          <a class="user_link" target="_blank" href="${owner.html_url}">
            ${owner.login}
          </a> /
          <a class="repos_link" target="_blank" href="${repos.html_url}">
            ${repos.name}
          </a>
        </div>
      </div>
      <div class="repos_info_container">
        <div class="repos_desc">
          ${repos.description}
        </div>
        <div class="repos_info">
          <em class="repos_language">${repos.language || ''}</em>
          <i aria-hidden="true" class="fa fa-star"></i>&nbsp;${repos.stargazers_count}&nbsp;&nbsp;
          <i aria-hidden="true" class="fa fa-eye"></i>&nbsp;${repos.watchers_count}&nbsp;&nbsp;
          <i aria-hidden="true" class="fa fa-code-fork"></i>&nbsp;${repos.forks_count}&nbsp;&nbsp;
          <i aria-hidden="true" class="fa fa-file-archive-o"></i>&nbsp;${repos.size}
        </div>
      </div>
    </div>
  </div>
  `
}

const userTemplate = (user) => {
  return `<div class="infos_container">
    <div class="info_container">
      <div class="info_icon">
        <i aria-hidden="true" class="fa fa-user-circle"></i>
      </div>&nbsp;&nbsp;${user.name || user.login}
    </div>
    ${user.location ? `<div class="info_container">
      <div class="info_icon">
        <i aria-hidden="true" class="fa fa-map-marker"></i>
      </div>&nbsp;&nbsp;${user.location}
    </div>` : ''}
    ${user.email ? `<a class="info_container" href="mailto:${user.email}">
      <div class="info_icon">
        <i aria-hidden="true" class="fa fa-envelope-o"></i>
      </div>&nbsp;&nbsp;${user.email}
    </a>` : ''}
    ${user.company ? `<div class="info_container">
      <div class="info_icon">
        <i aria-hidden="true" class="fa fa-users"></i>
      </div>&nbsp;&nbsp;${user.company}
    </div>` : ''}
    ${user.blog ? `<a class="info_container" target="_blank" href="${user.blog}">
      <div class="info_icon">
        <i aria-hidden="true" class="fa fa-chrome"></i>
      </div>&nbsp;&nbsp;${user.blog}
    </a>` : ''}
    ${user.bio ? `<div class="info_container info_bio">
      <div class="info_icon">
        <i aria-hidden="true" class="fa fa-quote-left"></i>
      </div>&nbsp;&nbsp;${user.bio}
    </div>` : ''}
    <div class="info_container info_social">
      <i aria-hidden="true" class="fa fa-cube"></i>&nbsp;${user.public_repos}&nbsp;&nbsp;
      <i aria-hidden="true" class="fa fa-user-plus"></i>&nbsp;${user.followers}&nbsp;&nbsp;
      <i aria-hidden="true" class="fa fa-calendar-check-o"></i>&nbsp;${user.updated_at.split('T')[0]}
    </div>
  </div>`;
};

const showNewResults = items => {
    const repos = items.map(item => {
      return reposTemplate(item);
    }).join('');
    $('.content_container').html(repos);
  }

const showUserInfo = ($dom, data) => {
   $dom.html(userTemplate(data));
};

$(() => {
  const $input = $('.search');
  const $conatiner = $('.content_container');
  const input$ = Rx.Observable.fromEvent($input, 'keyup')
        .filter(e => e.keyCode === 13)
        .debounce(400)
        .map(() => $input.val().trim())
        .filter(text => !!text)
        //相当于只缓存上次输入的值    distinct相当于全部缓存
        .distinctUntilChanged()
        .do(value => {
            console.log(value);
        })
        // 调用 getRepos 方法将返回一个 Observable
        // flatMap 则将所有 Observable 合并，转为一个 Observable
        .flatMapLatest(getRepos)
        .do(() => {
          $conatiner.html('')
        })
        .flatMap(results => Rx.Observable.from(results.items))
        .map(repos => $(reposTemplate(repos)))
        .do($repos => {
          $conatiner.append($repos); 
        })
        .flatMap($repos => {
          return initialUserInfoSteam($repos);
        })

  input$.subscribe(
    data => {
      // showNewResults(data.items);
      console.log('success');
    },
    err => {
      console.error(err);
    },
    () => {
      console.log('completed');
    }
  );
  const initialUserInfoSteam = ($repos) => {
    const $avator = $repos.find('.user_header');
    const avatorMouseover$ = Rx.Observable.fromEvent($avator, 'mouseover')
          .debounce(500)
          .takeWhile(() => {
            const $infosWrapper = $repos.find('.user_infos_wrapper');
            return $infosWrapper.find('.infos_container').length === 0;
          })
          .map((e) => {
            const $infosWrapper = $repos.find('.user_infos_wrapper');
            return {
              conatiner: $infosWrapper,
              url: $(e.target).attr('data-api')
            }
          })
          .filter(data => !!data.url)
          .flatMapLatest(getUser)
          .do(result => {
            const {data, conatiner} = result;
            showUserInfo(conatiner, data);
          })
    return avatorMouseover$;
  }
}) 

//发出多个异步事件之后，每个事件所耗费的时间不一定相同。如果前一个异步所用时间较后一个长，
//那么当它最终返回结果时，有可能把后面的异步率先返回的结果覆盖
/**
 * 在连续发出多个异步的时候，既然我们期待的是最后一个异步返回的结果，那么就可以把之前的异步取消掉，
 * 不 care 其返回了什么。因此，我们可以使用flatMapLatest API
 * （类似于 RxJava 中的switchMap API，同时在 RxJS 5.0 中也已经改名为switchMap）
 */