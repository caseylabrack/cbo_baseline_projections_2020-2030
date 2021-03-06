library(tidyverse)

data = read_csv("spending-baseline.csv")  %>%
  rename(func = `Function`) %>%
  gather(key = year, value = value, c(9,19)) %>%
  filter(!(func %in% c("920", "950"))) %>%
  group_by(year, func) %>%
  summarize(value = sum(value)) %>%
  spread(key = year, value = value) %>%
  full_join(read_csv("labels.csv"), by="func") %>%
  arrange(`2020`)

other = data %>% 
  slice(1:2)  %>%
  summarize(func = "999", `2020` = sum(`2020`), `2030` = sum(`2030`), label = "*", fullname = "Commerce and Housing Credit + Energy")

data = data %>% 
  slice(3:n()) %>% 
  full_join(other) %>%
  mutate(share2020 = `2020` / sum(`2020`), share2030 = `2030` / sum(`2030`)) %>% 
  arrange(as.numeric(func))

write_csv(data, "data-spread.csv")