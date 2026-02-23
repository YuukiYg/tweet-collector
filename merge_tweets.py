import pandas as pd
import glob
import os
import sys
from datetime import datetime

def merge_csv_files(input_pattern='*.csv', output_file='merged_tweets.csv'):
    """
    複数のCSVファイルを結合し、ID列で重複を削除する

    Args:
        input_pattern: 入力CSVファイルのパターン (デフォルト: '*.csv')
        output_file: 出力ファイル名 (デフォルト: 'merged_tweets.csv')
    """
    # CSVファイルのリストを取得
    csv_files = glob.glob(input_pattern)

    if not csv_files:
        print(f"エラー: パターン '{input_pattern}' に一致するCSVファイルが見つかりません")
        return

    print(f"見つかったCSVファイル数: {len(csv_files)}")
    for f in sorted(csv_files):
        print(f"  - {f}")

    # 全CSVファイルを読み込んで結合
    dfs = []
    for csv_file in csv_files:
        try:
            df = pd.read_csv(csv_file)
            print(f"\n{csv_file}: {len(df)} 行読み込み")
            dfs.append(df)
        except Exception as e:
            print(f"エラー: {csv_file} の読み込みに失敗しました - {e}")

    if not dfs:
        print("エラー: 有効なCSVファイルがありません")
        return

    # 全データフレームを結合
    merged_df = pd.concat(dfs, ignore_index=True)
    print(f"\n結合後の総行数: {len(merged_df)}")

    # ID列で重複を削除 (最初に出現したものを保持)
    if 'ID' in merged_df.columns:
        before_count = len(merged_df)
        merged_df = merged_df.drop_duplicates(subset='ID', keep='first')
        after_count = len(merged_df)
        removed_count = before_count - after_count
        print(f"重複削除: {removed_count} 件の重複を削除")
        print(f"最終行数: {after_count}")
    else:
        print("警告: 'ID' 列が見つかりません。重複削除をスキップします")

    # 日付順でソート
    if '投稿日時' in merged_df.columns:
        merged_df['投稿日時'] = pd.to_datetime(merged_df['投稿日時'])
        merged_df = merged_df.sort_values('投稿日時', ascending=False)
        print(f"日付順にソート完了 (新しい順)")
    else:
        print("警告: '投稿日時' 列が見つかりません。ソートをスキップします")

    # CSVファイルに出力
    merged_df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"\n結合完了: {output_file} に保存しました")
    print(f"ファイルサイズ: {os.path.getsize(output_file):,} バイト")

def print_usage():
    """使い方を表示"""
    print("=" * 60)
    print("CSV結合ツール - 使い方")
    print("=" * 60)
    print("\n【使用方法】")
    print("  python merge_tweets.py <フォルダパス>")
    print("\n【引数】")
    print("  <フォルダパス>: 結合したいCSVファイルが入っているフォルダ")
    print("\n【例】")
    print("  python merge_tweets.py .")
    print("  python merge_tweets.py /Users/yuuki/Desktop/規格外/csv")
    print("  python merge_tweets.py ~/Documents/tweets")
    print("\n【出力】")
    print("  指定したフォルダ内に {TARGET_USER_ID}_merged_tweets_YYYY-MM-DD.csv を生成")
    print("  (アカウントIDが検出できない場合は merged_tweets_YYYY-MM-DD.csv)")
    print("=" * 60)

if __name__ == '__main__':
    # 引数チェック
    if len(sys.argv) != 2:
        print("エラー: 引数が不足しています\n")
        print_usage()
        sys.exit(1)

    # フォルダパスを取得
    input_folder = sys.argv[1]

    # フォルダの存在チェック
    if not os.path.exists(input_folder):
        print(f"エラー: フォルダが見つかりません: {input_folder}\n")
        print_usage()
        sys.exit(1)

    if not os.path.isdir(input_folder):
        print(f"エラー: 指定されたパスはフォルダではありません: {input_folder}\n")
        print_usage()
        sys.exit(1)

    # CSVファイル名からアカウントIDを抽出
    csv_files = glob.glob(input_pattern)
    account_id = None

    # ファイル名のパターン: {account_id}_tweets_YYYY-MM-DD.csv
    for csv_file in csv_files:
        basename = os.path.basename(csv_file)
        if basename.startswith('merged_tweets'):
            continue  # merged_tweets ファイルはスキップ
        if '_tweets_' in basename:
            account_id = basename.split('_tweets_')[0]
            break

    # 現在日時を含むファイル名を生成
    timestamp = datetime.now().strftime('%Y-%m-%d')
    if account_id:
        output_filename = os.path.join(input_folder, f'{account_id}_merged_tweets_{timestamp}.csv')
    else:
        # アカウントIDが見つからない場合は従来の形式
        output_filename = os.path.join(input_folder, f'merged_tweets_{timestamp}.csv')

    # 指定フォルダ内の全CSVファイルを結合
    input_pattern = os.path.join(input_folder, '*.csv')

    print(f"対象フォルダ: {os.path.abspath(input_folder)}")
    print(f"出力ファイル: {output_filename}\n")

    merge_csv_files(
        input_pattern=input_pattern,
        output_file=output_filename
    )
