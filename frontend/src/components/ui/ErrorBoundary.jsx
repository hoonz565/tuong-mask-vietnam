import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env?.DEV) {
      console.error('[ErrorBoundary caught an error]:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="my-8 flex w-full flex-col items-center justify-center border border-secondary/40 bg-surface/80 p-8 text-center backdrop-blur"
        >
          <AlertTriangle className="mb-4 text-secondary" size={36} />
          <h3 className="text-base uppercase tracking-widest text-secondary font-bold">
            {this.props.title || 'Khu vực này gặp sự cố'}
          </h3>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-tertiary/70 font-sans">
            {this.state.error?.message || 'Đã xảy ra lỗi khi kết xuất nội dung. Bạn có thể thử tải lại khu vực này.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-6 inline-flex items-center gap-2 border border-secondary bg-secondary/10 px-5 py-2.5 text-xs uppercase tracking-wider text-secondary transition-colors hover:bg-secondary hover:text-primary cursor-pointer"
          >
            <RefreshCw size={14} /> Khôi phục khu vực
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
