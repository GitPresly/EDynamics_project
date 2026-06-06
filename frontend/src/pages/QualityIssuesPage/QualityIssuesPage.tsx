import React, { useState, useEffect } from 'react';
import { apiService, type QualityIssueProduct } from '../../services/api';
import './QualityIssuesPage.css';

export const QualityIssuesPage: React.FC = () => {
  const [products, setProducts] = useState<QualityIssueProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getQualityIssuesProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products with issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleExpand = (key: string) => {
    setExpanded((prev) => (prev === key ? null : key));
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString();
    } catch {
      return s;
    }
  };

  return (
    <div className="qi-page">
      <div className="qi-header">
        <h1>Products with Issues</h1>
        <button type="button" className="qi-btn-refresh" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="qi-error">{error}</div>}

      {!loading && !error && (
        <p className="qi-summary">
          {products.length === 0
            ? 'No products with quality issues found.'
            : `${products.length} product(s) have quality issues.`}
        </p>
      )}

      {loading && <p className="qi-loading">Loading…</p>}

      {!loading && products.length > 0 && (
        <div className="qi-table-wrap">
          <table className="qi-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Product ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Issues</th>
                <th>Last checked</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const key = `${p.providerId}:${p.id}`;
                const isOpen = expanded === key;
                return (
                  <React.Fragment key={key}>
                    <tr className="qi-row">
                      <td>{p.providerId}</td>
                      <td className="qi-id-cell">{p.id}</td>
                      <td>{p.name ?? <span className="qi-missing">—</span>}</td>
                      <td>{p.category ?? <span className="qi-missing">—</span>}</td>
                      <td>
                        {p.price !== null
                          ? `${p.price.toFixed(2)}`
                          : <span className="qi-missing">—</span>}
                      </td>
                      <td>
                        <span className="qi-issue-count">{p.qualityIssues.length}</span>
                      </td>
                      <td className="qi-date">{formatDate(p.updatedAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="qi-btn-toggle"
                          onClick={() => toggleExpand(key)}
                        >
                          {isOpen ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="qi-details-row">
                        <td colSpan={8}>
                          <ul className="qi-issues-list">
                            {p.qualityIssues.map((issue) => (
                              <li key={issue.rule} className="qi-issue-item">
                                <span className="qi-issue-rule">{issue.rule}</span>
                                <span className="qi-issue-msg">{issue.message}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
