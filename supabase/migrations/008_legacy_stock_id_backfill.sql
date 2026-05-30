-- Map legacy slug stock_ids to canonical DSE tickers for existing holdings/watchlists.

update public.holdings set stock_id = 'GP' where lower(stock_id) = 'gp';
update public.holdings set stock_id = 'BRACBANK' where lower(stock_id) = 'brac';
update public.holdings set stock_id = 'SQURPHARMA' where lower(stock_id) in ('squr', 'squrpharma');
update public.holdings set stock_id = 'BATBC' where lower(stock_id) = 'batbc';
update public.holdings set stock_id = 'RENATA' where lower(stock_id) = 'renata';
update public.holdings set stock_id = 'MARICO' where lower(stock_id) = 'marico';

update public.watchlists set stock_id = 'GP' where lower(stock_id) = 'gp';
update public.watchlists set stock_id = 'BRACBANK' where lower(stock_id) = 'brac';
update public.watchlists set stock_id = 'SQURPHARMA' where lower(stock_id) in ('squr', 'squrpharma');
update public.watchlists set stock_id = 'BATBC' where lower(stock_id) = 'batbc';
update public.watchlists set stock_id = 'RENATA' where lower(stock_id) = 'renata';
update public.watchlists set stock_id = 'MARICO' where lower(stock_id) = 'marico';

update public.transactions
set stock_id = 'GP', ticker = coalesce(ticker, 'GP')
where stock_id is not null and lower(stock_id) = 'gp';

update public.transactions
set stock_id = 'BRACBANK', ticker = coalesce(ticker, 'BRACBANK')
where stock_id is not null and lower(stock_id) = 'brac';

update public.transactions
set stock_id = 'SQURPHARMA', ticker = coalesce(ticker, 'SQURPHARMA')
where stock_id is not null and lower(stock_id) in ('squr', 'squrpharma');

update public.transactions
set stock_id = 'BATBC', ticker = coalesce(ticker, 'BATBC')
where stock_id is not null and lower(stock_id) = 'batbc';

update public.transactions
set stock_id = 'RENATA', ticker = coalesce(ticker, 'RENATA')
where stock_id is not null and lower(stock_id) = 'renata';

update public.transactions
set stock_id = 'MARICO', ticker = coalesce(ticker, 'MARICO')
where stock_id is not null and lower(stock_id) = 'marico';

update public.mock_orders
set stock_id = 'GP', symbol = 'GP'
where lower(stock_id) = 'gp';

update public.mock_orders
set stock_id = 'BRACBANK', symbol = 'BRACBANK'
where lower(stock_id) = 'brac';

update public.mock_orders
set stock_id = 'SQURPHARMA', symbol = 'SQURPHARMA'
where lower(stock_id) in ('squr', 'squrpharma');

update public.mock_orders
set stock_id = 'BATBC', symbol = 'BATBC'
where lower(stock_id) = 'batbc';

update public.mock_orders
set stock_id = 'RENATA', symbol = 'RENATA'
where lower(stock_id) = 'renata';

update public.mock_orders
set stock_id = 'MARICO', symbol = 'MARICO'
where lower(stock_id) = 'marico';
