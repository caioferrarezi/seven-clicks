import React, { Component } from 'react';

const searchURL = 'https://en.wikipedia.org/w/api.php?action=opensearch&origin=*&format=json&search=';
const contentURL = 'https://en.wikipedia.org/w/api.php?action=query&origin=*&prop=revisions&rvprop=content&format=json&titles=';
const findTerms = /\[\[\w.[^|]+?\]\]/gi;
const clearTerm = /\[|\]|\w+:/g;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      firstTerm: '',
      lastTerm: '',
      resultMessage: 'The result of your search will appear here',
      listOfTerms: [],
    }

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleInputChange(e) {
    const value = e.target.value
    const name = e.target.name;

    this.setState({
      [name]: value,
    })
  }

  handleSubmit(e) {
    e.preventDefault();

    this.setState({
      listOfTerms: [],
    })

    if (this.state.firstTerm)
      this.loopWiki(this.state.firstTerm, 0);
  }

  async loopWiki(term, i) {
    if (i < 7) await this.goWiki(term).then(term => {
      console.log(term, i);
      if (term) this.loopWiki(term, i + 1);
    });
  }

  async searchTerm(term) {
    if (term) {
      let url = searchURL + term;
      //let newTerm;
    
      return fetch(url)
        .then(response => response.json())
        .then(response => {
          let terms = response[1];
          let links = response[3];

          // if we want to get some random term in the array, we can do:
          //let randomIndex = Math.floor(Math.random() * terms.length);
          //newTerm = terms[randomIndex];
          if (terms[0]) {
            this.setState(state => {
              state.listOfTerms.push({
                term: terms[0],
                link: links[0],
              });
            })
            return terms[0]
          } else {
            return null;
          }
        })
    }
  }

  async goWiki(term) {
    term = await this.searchTerm(term);

    if (term) {
      let url = contentURL + term.replace(' ', '_');

      return fetch(url)
        .then(response => response.json())
        .then(response => {
          let data = response.query.pages;
          let content = data[Object.keys(data)[0]];

          if (this.state.lastTerm) {
            let revision = content.revisions[0]['*'];
            let title = content.title;
            let regex = new RegExp(this.state.lastTerm, 'gi');

            let vTerms = revision.match(regex) || [];

            if (vTerms.length > 0) {
              this.setState({
                resultMessage: `We've found the term '${vTerms[0]}' ${vTerms.length} times in the ${title}'s content`,
              });

              return false;
            }
            else {
              vTerms = revision.match(findTerms)
              let randomIndex = Math.floor(Math.random() * vTerms.length);
              let newTerm = vTerms[randomIndex].replace(clearTerm, '');

              this.setState({
                resultMessage: 'We\'re so sorry, but our search didn\'t find anything ):',
              });

              return newTerm;
            }
          }
        });
    } else {
      this.setState({
        resultMessage: 'We\'ve reached out our possibilities, so sorry ):'
      });
      return null;
    }
  }

  render() {
    const listOfTerms = this.state.listOfTerms;

    return (
      <div className="s-app">
        <header className="o-header">
          <div className="o-header__title">
            <h1>Result</h1>
            <p>{this.state.resultMessage}</p>
          </div>

          <form className="o-form" onSubmit={this.handleSubmit}>
            <label>Initial Term
              <input 
                value={this.state.firstTerm}
                onChange={this.handleInputChange}
                name="firstTerm" 
                type="text"
                autoComplete="off"
                className="o-form__input" />
            </label>
            
            <label>Last Term
              <input 
                value={this.state.lastTerm}
                onChange={this.handleInputChange}
                name="lastTerm" 
                type="text"
                autoComplete="off"
                className="o-form__input" />
            </label>

            <button 
              type="submit"
              className="o-form__button">Search</button>
          </form>
        </header>

        <main className="o-result">
          {listOfTerms.length > 0 &&
            <ol className="o-result__list">{
              listOfTerms.map((item, i) => {
                return <li key={i}>
                  {item.term}
                  <a href={item.link} target="_blank">view full article &rarr;</a>
                </li>
              })
            }</ol>
          }
        </main>
      </div>
    );
  }
}

export default App;
