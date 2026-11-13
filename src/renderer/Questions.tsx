import type { QuestionsBlock } from '../types/schema';

export function Questions({ block }: { block: QuestionsBlock }) {
  return <section className="questions-block">
    {block.title?.trim() && <h3>{block.title}</h3>}
    {block.mode === 'mark' ? <div className="questions-scroll"><table><thead><tr>{block.columns.map(col => <th key={col.id}>{col.label}</th>)}<th>Pregunta</th>{block.options.map(option => <th key={option.id}>{option.label}</th>)}</tr></thead><tbody>{block.items.map((item, index) => <tr key={item.id}>{item.cells.map((cell, i) => <td key={block.columns[i].id}>{cell}</td>)}<td>{block.numbered && `${index + 1}. `}{item.text}</td>{block.options.map(option => <td key={option.id} className="questions-box">□</td>)}</tr>)}</tbody></table></div> : <div>{block.items.map((item, index) => <div className="question-write" key={item.id}>{block.numbered && <span className="question-number">{index + 1}</span>}<div className="question-copy"><div>{item.text}</div>{Array.from({ length: item.lines }, (_, i) => <div className="question-line" key={i} />)}</div></div>)}</div>}
  </section>;
}
