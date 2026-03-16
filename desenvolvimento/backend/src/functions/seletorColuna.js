const objetoRetornado = async function(coluna){
    let entre = [];
    if (coluna === 'dcod_est_cadastral_fam') {
        entre = [{ 'pessoas_sem_registro': 'p_2' }, { 'pessoas_com_registro': 'p_3' }, { 'pessoas_sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familias_sem_registro': 'f_2' }, { 'familias_com_registro': 'f_3' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'dfx_rfpc') {
        entre = [{ 'pessoas_ate_R$89': 'p_1' }, { 'pessoas_entre_R$89ø01_ate_R$178': 'p_2' }, { 'pessoas_entre_R$178ø01_ate_meio_salario': 'p_3' },
        { 'pessoas_acima_de_meio_salario': 'p_4' }, { 'pessoas_sem_dados': 'v' }, { 'total_de_pessoas': 'w' }, { 'familias_ate_R$89': 'f_1' },
        { 'familias_$89ø01_ate_R$178': 'f_2' }, { 'familias_entre_R$178ø01_ate_meio_salario': 'f_3' }, { 'familias_acima_de_meio_salario': 'f_4' },
        { 'familias_sem_dados': 'y' }, { 'total_de_familias': 'x' },]
    }
    if (coluna === 'dcod_forma_coleta_fam') {
        entre = [{ 'pessoas_informação_migrada_como_inexistente': 'p_0' }, { 'pessoas_sem_visita_domiciliar': 'p_1' }, { 'pessoas_com_visita_domiciliar': 'p_2' },
        { 'pessoas_sem_dados': 'v' }, { 'pessoas_total': 'w' }, { 'familias_informacao_migrada_como_inexistente': 'f_0' }, { 'familias_sem_visita_domiciliar': 'f_1' },
        { 'familias_com_visita_domiciliar': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'dqtde_meses_desat_cat') {
        entre = [{ 'pessoas_ate_12_meses': 'p_0' }, { 'pessoas_13_a_18_meses': 'p_1' }, { 'pessoas_19_a_24_meses': 'p_2' }, { 'pessoas_25_a_36_meses': 'p_3' },
        { 'pessoas_37_a_48_meses': 'p_4' }, { 'pessoas_acima_de_48_meses': 'p_5' }, { 'pessoas_sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familias_ate_12_meses': 'f_0' }, { 'familias_13_a_18_meses': 'f_1' }, { 'familias_19_a_24_meses': 'f_2' }, { 'familias_25_a_36_meses': 'f_3' },
        { 'familias_37_a_48_meses': 'f_4' }, { 'familias_acima_de_48_meses': 'f_5' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'dmarc_pbf') {
        entre = [{ 'pessoas_que_não_recebem': 'p_0' }, { 'pessoas_que_recebem': 'p_1' }, { 'pessoas_sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familias_que_não_recebem': 'f_0' }, { 'familias_que_recebem': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]

    }
    if (coluna === 'dcod_calcamento_domic_fam') {
        entre = [{ 'pessoas_calçamento_total': 'p_1' }, { 'pessoas_calçamento_parcial': 'p_2' }, { 'pessoas_calçamento_não_existe': 'p_3' },
        { 'pessoas_calçamento_sem_dados': 'v' }, { 'pessoas_total': 'w' }, { 'familias_calçamento_total': 'f_1' }, { 'familias_calçamento_parcial': 'f_2' },
        { 'familias_calçamento_não_existe': 'f_3' }, { 'familias_calçamento_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'dcod_local_domic_fam') {
        entre = [{ 'pessoas_domicilios_urbanos': 'p_1' }, { 'pessoas_domicilios_rurais': 'p_2' }, { 'pessoas_domicilios_sem_dados': 'v' },
        { 'pessoas_domicilios_total': 'w' }, { 'familias_domicilios_urbanos': 'f_1' }, { 'familias_domicilios_rurais': 'f_2' },
        { 'familias_domicilios_sem_dados': 'y' }, { 'familias_domicilios_total': 'x' }]
    }
    if (coluna === 'dcod_especie_domic_fam') {
        entre = [{ 'particular_permanente_por_pessoa': 'p_1' }, { 'particular_improvisado_por_pessoa': 'p_2' }, { 'coletivo_por_pessoa': 'p_3' },
        { 'pessoas_sem_dados': 'v' }, { 'pessoa_total': 'w' }, { 'particular_permanente_por_familia': 'f_1' }, { 'particular_improvisado_por_familia': 'f_2' },
        { 'coletivo_por_familia': 'f_3' }, { 'familias_sem_dados': 'y' }, { 'familia_total': 'x' }]
    }
    if (coluna === 'dcod_banheiro_domic_fam') {
        entre = [{ 'sim_por_pessoa': 'p_1' }, { 'não_por_pessoa': 'p_2' }, { 'pessoas_sem_dados': 'v' }, { 'pessoa_total': 'w' },
        { 'sim_por_familia': 'f_1' }, { 'não_por_familia': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'dcod_abaste_agua_domic_fam') {
        entre = [{ 'rede_geral_de_distribuição_por_pessoa': 'p_1' }, { 'poço_ou_nascente_por_pessoa': 'p_2' }, { 'cisterna_por_pessoa': 'p_3' },
        { 'outra_forma_por_pessoa': 'p_4' }, { 'pessoas_sem_dados': 'v' }, { 'pessoa_total': 'w' }, { 'rede_geral_de_distribuição_por_familia': 'f_1' },
        { 'poço_ou_nascente_por_familia': 'f_2' }, { 'cisterna_por_familia': 'f_3' }, { 'outra_forma_por_familia': 'f_4' }, { 'familias_sem_dados': 'y' },
        { 'familia_total': 'x' }]
    }
    if (coluna === 'dcod_destino_lixo_domic_fam') {
        entre = [{ 'coletado_diretamente_por_pessoa': 'p_1' }, { 'coletado_indiretamente_por_pessoa': 'p_2' }, { 'queimado_ou_enterrado_na_propriedade_por_pessoa': 'p_3' },
        { 'jogado_em_terreno_baldio_ou_logradouro_(rua,_avenida,_etc)_por_pessoa': 'p_4' }, { 'jogado_em_rio_ou_mar_por_pessoa': 'p_5' }, { 'tem_outro_destino_por_pessoa': 'p_6' },
        { 'pessoas_sem_dados': 'v' }, { 'pessoa_total': 'w' }, { 'coletado_diretamente_por_familia': 'f_1' }, { 'coletado_indiretamente_por_familia': 'f_2' },
        { 'queimado_ou_enterrado_na_propriedade_por_familia': 'f_3' }, { 'jogado_em_terreno_baldio_ou_logradouro_(rua,_avenida,_etc)_por_familia': 'f_4' },
        { 'jogado_em_rio_ou_mar_por_familia': 'f_5' }, { 'tem_outro_destino_por_familia': 'f_6' }, { 'familias_sem_dados': 'y' }, { 'familia_total': 'x' }]
    }
    if (coluna === 'dcod_escoa_sanitario_domic_fam') {
        entre = [{ 'pessoas_Rede_coletora_de_esgoto_ou_pluvial': 'p_1' }, { 'pessoas_Fossa_septica': 'p_2' }, { 'pessoas_Fossa_rudimentar': 'p_3' },
        { 'pessoas_Vala_a_ceu_aberto': 'p_4' }, { 'pessoas_Direto_para_um_rio,_lago_ou_mar': 'p_5' }, { 'pessoas_Outra_forma': 'p_6' },
        { 'pessoas_sem_dados': 'v' }, { 'pessoas_total': 'w' }, { 'familias_Rede_coletora_de_esgoto_ou_pluvial': 'f_1' },
        { 'familias_Fossa_septica': 'f_2' }, { 'familias_Fossa_rudimentar': 'f_3' }, { 'familias_Vala_a_ceu_aberto': 'f_4' },
        { 'familias_Direto_para_um_rio,_lago_ou_mar': 'f_5' }, { 'familias_Outra_forma': 'f_6' }, { 'familias_sem_dados': 'y' },
        { 'familias_total': 'x' }]
    }
    if (coluna === 'dcod_material_domic_fam') {
        entre = [{ 'pessoas_Alvenaria/tijolo_com_revestimento': 'p_1' }, { 'pessoas_Alvenaria/tijolo_sem_revestimento': 'p_2' },
        { 'pessoas_Madeira_aparelhada': 'p_3' }, { 'pessoas_Taipa_revestida': 'p_4' }, { 'pessoas_Taipa_não_revestida': 'p_5' },
        { 'pessoas_Madeira_aproveitada': 'p_6' }, { 'pessoas_Palha': 'p_7' }, { 'pessoas_Outro_Material': 'p_8' },
        { 'pessoas_sem_dados': 'v' }, { 'pessoas_total': 'w' }, { 'familias_Alvenaria/tijolo_com_revestimento': 'f_1' },
        { 'familias_Alvenaria/tijolo_sem_revestimento': 'f_2' }, { 'familias_Madeira_aparelhada': 'f_3' }, { 'familias_Taipa_revestida': 'f_4' },
        { 'familias_Taipa_não_revestida': 'f_5' }, { 'familias_Madeira_aproveitada': 'f_6' }, { 'familias_Palha': 'f_7' },
        { 'familias_Outro_Material': 'f_8' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'dcod_material_piso_fam') {
        entre = [{ 'pessoas_Terra': 'p_1' }, { 'pessoas_Cimento': 'p_2' }, { 'pessoas_Madeira_aproveitada': 'p_3' },
        { 'pessoas_Madeira_aparelhada': 'p_4' }, { 'pessoas_Ceramica,_lajota_ou_pedra': 'p_5' }, { 'pessoas_Carpete': 'p_6' },
        { 'pessoas_Outro_Material': 'p_7' }, { 'pessoas_sem_dados': 'v' }, { 'pessoas_total': 'w' }, { 'familias_Terra': 'f_1' },
        { 'familias_Cimento': 'f_2' }, { 'familias_Madeira_aproveitada': 'f_3' }, { 'familias_Madeira_aparelhada': 'f_4' },
        { 'familias_Ceramica,_lajota_ou_pedra': 'f_5' }, { 'familias_Carpete': 'f_6' }, { 'familias_Outro_Material': 'f_7' },
        { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'dcod_agua_canalizada_fam') {
        entre = [{ 'sim_por_pessoa': 'p_1' }, { 'não_por_pessoa': 'p_2' }, { 'sem_dados_por_pessoas': 'v' }, { 'total_pessoas': 'w' },
        { 'sim_por_familias': 'f_1' }, { 'não_por_familias': 'f_2' }, { 'sem_dados_por_familias': 'y' }, { 'total_familias': 'x' }]
    }
    if (coluna === 'dcod_iluminacao_domic_fam') {
        entre = [{ 'pessoas_Eletrica_com_medidor_próprio': 'p_1' }, { 'pessoas_Eletrica_com_medidor_comunitário': 'p_2' }, { 'pessoas_Eletrica_sem_medidor': 'p_3' },
        { 'pessoas_óleo,_querosene_ou_gás': 'p_4' }, { 'pessoas_Vela': 'p_5' }, { 'pessoas_Outra_forma': 'p_6' }, { 'pessoas_sem_dados': 'v' },
        { 'pessoas_total': 'w' }, { 'familias_Eletrica_com_medidor_próprio': 'f_1' }, { 'familias_Eletrica_com_medidor_comunitário': 'f_2' },
        { 'familias_Eletrica_sem_medidor': 'f_3' }, { 'familias_óleo,_querosene_ou_gás': 'f_4' }, { 'familias_Vela': 'f_5' },
        { 'familias_Outra_forma': 'f_6' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'dcod_calcamento_domic_fam') {
        entre = [{ 'pessoas_calçamento_total': 'p_1' }, { 'pessoas_calçamento_parcial': 'p_2' }, { 'pessoas_calçamento_não_existe': 'p_3' },
        { 'pessoas_sem_dados': 'v' }, { 'pessoas_total': 'w' }, { 'familias_calçamento_total': 'f_1' }, { 'familias_calçamento_parcial': 'f_2' },
        { 'familias_calçamento_não_existe': 'f_3' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'dcod_familia_indigena_fam') {
        entre = [{ 'sim_por_pessoa': 'p_1' }, { 'não_por_pessoa': 'p_2' }, { 'sem_dados_por_pessoa': 'v' },
        { 'pessoas_total': 'w' }, { 'sim_por_familias': 'f_1' }, { 'não_por_familias': 'f_2' },
        { 'sem_dados_por_familias': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'dind_familia_quilombola_fam') {
        entre = [{ 'sim_por_pessoa': 'p_1' }, { 'não_por_pessoa': 'p_2' }, { 'sem_dados_por_pessoa': 'v' }, { 'pessoas_total': 'w' },
        { 'sim_por_familias': 'f_1' }, { 'não_por_familias': 'f_2' }, { 'familias_sem_dados_por_familias': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pcod_raca_cor_pessoa') {
        entre = [{ 'pessoas_branca': 'p_1' }, { 'pessoas_preta': 'p_2' }, { 'pessoas_amarela': 'p_3' }, { 'pessoas_parda': 'p_4' },
        { 'pessoas_indigena': 'p_5' }, { 'pessoas_sem_dados': 'v' }, { 'pessoas_total': 'w' }, { 'familias_branca': 'f_1' },
        { 'familias_preta': 'f_2' }, { 'familias_amarela': 'f_3' }, { 'familias_parda': 'f_4' }, { 'familias_indigena': 'f_5' },
        { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pfx_idade') {
        entre = [{ 'pessoas_Entre_0_e_4_anos': 'p_0' }, { 'pessoas_Entre_5_a_6_anos': 'p_1' }, { 'pessoas_Entre_7_a_15_anos': 'p_2' },
        { 'pessoas_Entre_16_a_17_anos': 'p_3' }, { 'pessoas_Entre_18_a_24_anos': 'p_4' }, { 'pessoas_Entre_25_a_34_anos': 'p_5' },
        { 'pessoas_Entre_35_a_39_anos': 'p_6' }, { 'pessoas_Entre_40_a_44_anos': 'p_7' }, { 'pessoas_Entre_45_a_49_anos': 'p_8' },
        { 'pessoas_Entre_50_a_54_anos': 'p_9' }, { 'pessoas_Entre_55_a_59_anos': 'p_10' }, { 'pessoas_Entre_60_a_64_anos': 'p_11' },
        { 'pessoas_Maior_que_65_anos': 'p_12' }, { 'pessoas_sem_dados': 'v' }, { 'pessoas_total': 'w' }, { 'familias_Entre_0_e_4_anos': 'f_0' },
        { 'familias_Entre_5_a_6_anos': 'f_1' }, { 'familias_Entre_7_a_15_anos': 'f_2' }, { 'familias_Entre_16_a_17_anos': 'f_3' },
        { 'familias_Entre_18_a_24_anos': 'f_4' }, { 'familias_Entre_25_a_34_anos': 'f_5' }, { 'familias_Entre_35_a_39_anos': 'f_6' },
        { 'familias_Entre_40_a_44_anos': 'f_7' }, { 'familias_Entre_45_a_49_anos': 'f_8' }, { 'familias_Entre_50_a_54_anos': 'f_9' },
        { 'familias_Entre_55_a_59_anos': 'f_10' }, { 'familias_Entre_60_a_64_anos': 'f_11' }, { 'familias_Maior_que_65_anos': 'f_12' },
        { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }

    if (coluna === 'pmarc_pbf') {
        entre = [{ 'sim': 'p_1' }, { 'não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'sim': 'f_1' }, { 'não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }

    if (coluna === 'pcod_parentesco_rf_pessoa') {
        entre = [{ 'pessoas_Pessoa_Responsavel_pela_Unidade_Familiar': 'p_1' }, { 'pessoas_Conjuge_ou_companheiro(a)': 'p_2' }, { 'pessoas_Filho(a)': 'p_3' },
        { 'pessoas_Enteado(a)': 'p_4' }, { 'pessoas_Neto(a)_ou_bisneto(a)': 'p_5' }, { 'pessoas_Pai_ou_mae': 'p_6' }, { 'pessoas_Sogro(a)': 'p_7' },
        { 'pessoas_Irmao_ou_irma': 'p_8' }, { 'pessoas_Genro_ou_nora': 'p_9' }, { 'pessoas_Outro_parente': 'p_10' }, { 'pessoas_Não_parente': 'p_11' },
        { 'pessoas_sem_dados': 'v' }, { 'pessoas_total': 'w' }, { 'familias_Pessoa_Responsavel_pela_Unidade_Familiar': 'f_1' },
        { 'familias_Conjuge_ou_companheiro(a)': 'f_2' }, { 'familias_Filho(a)': 'f_3' }, { 'familias_Enteado(a)': 'f_4' }, { 'familias_Neto(a)_ou_bisneto(a)': 'f_5' },
        { 'familias_Pai_ou_mae': 'f_6' }, { 'familias_Sogro(a)': 'f_7' }, { 'familias_Irmao_ou_irma': 'f_8' }, { 'familias_Genro_ou_nora': 'f_9' },
        { 'familias_Outro_parente': 'f_10' }, { 'familias_Não_parente': 'f_11' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pcod_sexo_pessoa') {
        entre = [{ 'Masculino': 'p_1' }, { 'Feminino': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'Masculino': 'f_1' }, { 'Feminino': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pind_trabalho_infantil_pessoa') {
        entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    /*
    * Discrepancia encontrada no dicionariotudo.csv
    * opcoes 0 e 1 consta como nao marcada no formulario
    * necessario adequacao de fatores.
    * alguns campos estao marcados como 1, mas no dicionario sao 0
    */

    if (coluna === 'pind_ajuda_especializado_memb') {
        entre = [{ 'Opção_não_marcada_no_formulario': 'p_0' }, { 'Opção_marcada_no_formulario': 'p_1' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familia_Opção_não_marcada_no_formulario': 'f_0' }, { 'familia_Opção_marcada_no_formulario': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pind_ajuda_familia_memb') {
        entre = [{ 'Opção_não_marcada_no_formulario': 'p_0' }, { 'Opção_marcada_no_formulario': 'p_1' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familia_Opção_não_marcada_no_formulario': 'f_0' }, { 'familia_Opção_marcada_no_formulario': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    // if (coluna === 'pind_ajuda_familia_memb') {
    //     entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
    //     { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    // }
    if (coluna === 'pind_ajuda_instituicao_memb') {
        entre = [{ 'Opção_não_marcada_no_formulario': 'p_0' }, { 'Opção_marcada_no_formulario': 'p_1' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familia_Opção_não_marcada_no_formulario': 'f_0' }, { 'familia_Opção_marcada_no_formulario': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pind_ajuda_nao_memb') {
        entre = [{ 'Opção_não_marcada_no_formulario': 'p_0' }, { 'Opção_marcada_no_formulario': 'p_1' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familia_Opção_não_marcada_no_formulario': 'f_0' }, { 'familia_Opção_marcada_no_formulario': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pind_ajuda_outra_memb') {
        entre = [{ 'Opção_não_marcada_no_formulario': 'p_0' }, { 'Opção_marcada_no_formulario': 'p_1' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familia_Opção_não_marcada_no_formulario': 'f_0' }, { 'familia_Opção_marcada_no_formulario': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pind_ajuda_vizinho_memb') {
        entre = [{ 'Opção_não_marcada_no_formulario': 'p_0' }, { 'Opção_marcada_no_formulario': 'p_1' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familia_Opção_não_marcada_no_formulario': 'f_0' }, { 'familia_Opção_marcada_no_formulario': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pind_def_cegueira_memb') {
        entre = [{ 'Opção_não_marcada_no_formulario': 'p_0' }, { 'Opção_marcada_no_formulario': 'p_1' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familia_Opção_não_marcada_no_formulario': 'f_0' }, { 'familia_Opção_marcada_no_formulario': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pind_def_sindrome_down_memb') {
        entre = [{ 'Opção_não_marcada_no_formulario': 'p_0' }, { 'Opção_marcada_no_formulario': 'p_1' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familia_Opção_não_marcada_no_formulario': 'f_0' }, { 'familia_Opção_marcada_no_formulario': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pind_def_fisica_memb') {
        entre = [{ 'Opção_não_marcada_no_formulario': 'p_0' }, { 'Opção_marcada_no_formulario': 'p_1' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familia_Opção_não_marcada_no_formulario': 'f_0' }, { 'familia_Opção_marcada_no_formulario': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pind_def_mental_memb') {
        entre = [{ 'Opção_não_marcada_no_formulario': 'p_0' }, { 'Opção_marcada_no_formulario': 'p_1' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familia_Opção_não_marcada_no_formulario': 'f_0' }, { 'familia_Opção_marcada_no_formulario': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pind_def_surdez_leve_memb') {
        entre = [{ 'Opção_não_marcada_no_formulario': 'p_0' }, { 'Opção_marcada_no_formulario': 'p_1' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familia_Opção_não_marcada_no_formulario': 'f_0' }, { 'familia_Opção_marcada_no_formulario': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pind_def_surdez_profunda_memb') {
        entre = [{ 'Opção_não_marcada_no_formulario': 'p_0' }, { 'Opção_marcada_no_formulario': 'p_1' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familia_Opção_não_marcada_no_formulario': 'f_0' }, { 'familia_Opção_marcada_no_formulario': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pind_def_transtorno_mental_memb') {
        entre = [{ 'Opção_não_marcada_no_formulario': 'p_0' }, { 'Opção_marcada_no_formulario': 'p_1' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familia_Opção_não_marcada_no_formulario': 'f_0' }, { 'familia_Opção_marcada_no_formulario': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pind_def_baixa_visao_memb') {
        entre = [{ 'Opção_não_marcada_no_formulario': 'p_0' }, { 'Opção_marcada_no_formulario': 'p_1' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familia_Opção_não_marcada_no_formulario': 'f_0' }, { 'familia_Opção_marcada_no_formulario': 'f_1' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pcod_trabalhou_memb') {
        entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }

    // if (coluna === 'pind_ajuda_nao_memb') {
    //     entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
    //     { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    // }
    // if (coluna === 'pind_ajuda_outra_memb') {
    //     entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
    //     { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    // }
    // if (coluna === 'pind_ajuda_vizinho_memb') {
    //     entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
    //     { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    // }
    // if (coluna === 'pind_def_cegueira_memb') {
    //     entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
    //     { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    // }
    // if (coluna === 'pind_def_sindrome_down_memb') {
    //     entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
    //     { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    // }
    // if (coluna === 'pind_def_fisica_memb') {
    //     entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
    //     { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    // }
    // if (coluna === 'pind_def_mental_memb') {
    //     entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
    //     { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    // }
    // if (coluna === 'pind_def_surdez_leve_memb') {
    //     entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
    //     { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    // }
    // if (coluna === 'pind_def_surdez_profunda_memb') {
    //     entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
    //     { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    // }
    // if (coluna === 'pind_def_transtorno_mental_memb') {
    //     entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
    //     { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    // }
    // if (coluna === 'pind_def_baixa_visao_memb') {
    //     entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
    //     { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    // }
    /*
    * acima bloco de campos com discrepancia no dicionariotudo.csv
    * 
    */
    if (coluna === 'pcod_deficiencia_memb') {
        entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    if (coluna === 'pcod_ano_serie_frequenta_memb') {
        entre = [
            { 'Primeiro(a)': 'p_1' },
            { 'Segundo(a)': 'p_2' },
            { 'Terceiro(a)': 'p_3' },
            { 'Quarto(a)': 'p_4' },
            { 'Quinto(a)': 'p_5' },
            { 'Sexto(a)': 'p_6' },
            { 'Setimo(a)': 'p_7' },
            { 'Oitavo(a)': 'p_8' },
            { 'Nono(a)': 'p_9' },
            { 'Curso_não_seriado(a)': 'p_10' },
            { 'sem_dados': 'v' },
            { 'pessoas_total': 'w' },
            { 'familias_Primeiro(a)': 'f_1' },
            { 'familias_Segundo(a)': 'f_2' },
            { 'familias_Terceiro(a)': 'f_3' },
            { 'familias_Quarto(a)': 'f_4' },
            { 'familias_Quinto(a)': 'f_5' },
            { 'familias_Sexto(a)': 'f_6' },
            { 'familias_Setimo(a)': 'f_7' },
            { 'familias_Oitavo(a)': 'f_8' },
            { 'familias_Nono(a)': 'f_9' },
            { 'familias_Curso_nao_seriado(a)': 'f_10' },
            { 'familias_sem_dados': 'y' },
            { 'familias_total': 'x' }]
    }

    if (coluna === 'pcod_concluiu_frequentou_memb') {
        entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }

    if (coluna === 'pcod_curso_frequentou_pessoa_memb') {
        entre = [
            { 'Creche': 'p_1' },
            { 'Pre_escola_(exceto_CA)': 'p_2' },
            { 'Classe_de_Alfabetizacao_CA': 'p_3' },
            { 'Ensino_Fundamental_1ª_a_4ª_series,_Elementar_(Primario),_Primeira_fase_do_1º_grau': 'p_4' },
            { 'Ensino_Fundamental_5ª_a_8ª_series,_Medio_1º_ciclo_(Ginasial),_Segunda_fase_do_1º_grau': 'p_5' },
            { 'Ensino_Fundamental_(duracao_9_anos)': 'p_6' },
            { 'Ensino_Fundamental_Especial': 'p_7' },
            { 'Ensino_Medio,_2º_grau,_Medio_2º_ciclo_(Cientifico,_Classico,_Tecnico,_Normal)': 'p_8' },
            { 'Ensino_Medio_Especial': 'p_9' },
            { 'Ensino_Fundamental_EJA_series_iniciais_(Supletivo_1ª_a_4ª)': 'p_10' },
            { 'Ensino_Fundamental_EJA_series_finais_(Supletivo_5ª_a_8ª)': 'p_11' },
            { 'Ensino_Medio_EJA(Supletivo)': 'p_12' },
            { 'Superior,_Aperfeicoamento,_Especializacao,_Mestrado,_Doutorado': 'p_13' },
            { 'Alfabetizacao_para_Adultos(Mobral,_etc)': 'p_14' },
            { 'Nenhum': 'p_15' },
            { 'sem_dados': 'v' },
            { 'pessoas_total': 'w' },
            { 'familia_Creche': 'f_1' },
            { 'familia_Pre_escola_(exceto_CA)': 'f_2' },
            { 'familia_Classe_de_Alfabetizacao_CA': 'f_3' },
            { 'familia_Ensino_Fundamental_1ª_a_4ª_series,_Elementar_(Primario),_Primeira_fase_do_1º_grau': 'f_4' },
            { 'familia_Ensino_Fundamental_5ª_a_8ª_series,_Medio_1º_ciclo_(Ginasial),_Segunda_fase_do_1º_grau': 'f_5' },
            { 'familia_Ensino_Fundamental_(duracao_9_anos)': 'f_6' },
            { 'familia_Ensino_Fundamental_Especial': 'f_7' },
            { 'familia_Ensino_Medio,_2º_grau,_Medio_2º_ciclo_(Cientifico,_Classico,_Tecnico,_Normal)': 'f_8' },
            { 'familia_Ensino_Medio_Especial': 'f_9' },
            { 'familia_Ensino_Fundamental_EJA_series_iniciais_(Supletivo_1ª_a_4ª)': 'f_10' },
            { 'familia_Ensino_Fundamental_EJA_series_finais_(Supletivo_5ª_a_8ª)': 'f_11' },
            { 'familia_Ensino_Medio_EJA(Supletivo)': 'f_12' },
            { 'familia_Superior,_Aperfeicoamento,_Especializacao,_Mestrado,_Doutorado': 'f_13' },
            { 'familia_Alfabetizacao_para_Adultos(Mobral,_etc)': 'f_14' },
            { 'familia_Nenhum': 'f_15' },
            { 'familias_sem_dados': 'y' },
            { 'familias_total': 'x' }]
    }

    if (coluna === 'pcod_curso_frequenta_memb') {
        entre = [
            { 'Creche': 'p_1' },
            { 'Pre_escola_(exceto_CA)': 'p_2' },
            { 'Classe_de_Alfabetizacao_CA': 'p_3' },
            { 'Ensino_Fundamental_regular_(duracao_8_anos)': 'p_4' },
            { 'Ensino_Fundamental_regular_(duracao_9_anos)': 'p_5' },
            { 'Ensino_Fundamental_especial': 'p_6' },
            { 'Ensino_Medio_regular': 'p_7' },
            { 'Ensino_Medio_especial': 'p_8' },
            { 'Ensino_Fundamental_EJA_series_iniciais_(Supletivo_1ª_a_4ª)': 'p_9' },
            { 'Ensino_Fundamental_EJA_series_finais_(Supletivo_5ª_a_8ª)': 'p_10' },
            { 'Ensino_Medio_EJA_(Supletivo)': 'p_11' },
            { 'Alfabetizacao_para_adultos(Mobral,_etc)': 'p_12' },
            { 'Superior,_Aperfeicoamento,_Especializacao,_Mestrado,_Doutorado': 'p_13' },
            { 'Pre_-_vestibular': 'p_14' },
            { 'sem_dados': 'v' },
            { 'pessoas_total': 'w' },
            { 'familia_Creche': 'f_1' },
            { 'familia_Pre_escola_(exceto_CA)': 'f_2' },
            { 'familia_Classe_de_Alfabetizacao_CA': 'f_3' },
            { 'familia_Ensino_Fundamental_regular_(duracao_8_anos)': 'f_4' },
            { 'familia_Ensino_Fundamental_regular_(duracao_9_anos)': 'f_5' },
            { 'familia_Ensino_Fundamental_especial': 'f_6' },
            { 'familia_Ensino_Medio_regular': 'f_7' },
            { 'familia_Ensino_Medio_especial': 'f_8' },
            { 'familia_Ensino_Fundamental_EJA_series_iniciais_(Supletivo_1ª_a_4ª)': 'f_9' },
            { 'familia_Ensino_Fundamental_EJA_series_finais_(Supletivo_5ª_a_8ª)': 'f_10' },
            { 'familia_Ensino_Medio_EJA_(Supletivo)': 'f_11' },
            { 'familia_Alfabetizacao_para_adultos(Mobral,_etc)': 'f_12' },
            { 'familia_Superior,_Aperfeicoamento,_Especializacao,_Mestrado,_Doutorado': 'f_13' },
            { 'familia_Pre_-_vestibular': 'f_14' },
            { 'familias_sem_dados': 'y' },
            { 'familias_total': 'x' }]
    }
    if (coluna === 'pgrau_instrucao') {
        entre = [
            { 'Sem_instrucao': 'p_1' },
            { 'Fundamental_incompleto': 'p_2' },
            { 'Fundamental_completo': 'p_3' },
            { 'Medio_incompleto': 'p_4' },
            { 'Medio_completo': 'p_5' },
            { 'Superior_incompleto_ou_mais': 'p_6' },
            { 'sem_dados': 'v' },
            { 'pessoas_total': 'w' },
            { 'familia_Sem_instrucao': 'f_1' },
            { 'familia_Fundamental_incompleto': 'f_2' },
            { 'familia_Fundamental_completo': 'f_3' },
            { 'familia_Medio_incompleto': 'f_4' },
            { 'familia_Medio_completo': 'f_5' },
            { 'familia_Superior_incompleto_ou_mais': 'f_6' },
            { 'familia_familias_sem_dados': 'y' },
            { 'familia_familias_total': 'x' }]
    }
    if (coluna === 'pind_frequenta_escola_memb') {
        entre = [
            { 'Sim,_rede_publica': 'p_1' },
            { 'Sim,_rede_particular': 'p_2' },
            { 'Nao,_ja_frequentou': 'p_3' },
            { 'Nunca_frequentou': 'p_4' },
            { 'sem_dados': 'v' },
            { 'pessoas_total': 'w' },
            { 'familia_Sim,_rede_publica': 'f_1' },
            { 'familia_Sim,_rede_particular': 'f_2' },
            { 'familia_Nao,_ja_frequentou': 'f_3' },
            { 'familia_Nunca_frequentou': 'f_4' },
            { 'familias_sem_dados': 'y' },
            { 'familias_total': 'x' }]
    }

    if (coluna === 'pcod_sabe_ler_escrever_memb') {
        entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }

    if (coluna === 'pcod_ano_serie_frequentou_memb') {
        entre = [
            { 'Primeiro(a)': 'p_1' },
            { 'Segundo(a)': 'p_2' },
            { 'Terceiro(a)': 'p_3' },
            { 'Quarto(a)': 'p_4' },
            { 'Quinto(a)': 'p_5' },
            { 'Sexto(a)': 'p_6' },
            { 'Setimo(a)': 'p_7' },
            { 'Oitavo(a)': 'p_8' },
            { 'Nono(a)': 'p_9' },
            { 'Curso_não_seriado(a)': 'p_10' },
            { 'sem_dados': 'v' },
            { 'pessoas_total': 'w' },
            { 'familias_Primeiro(a)': 'f_1' },
            { 'familias_Segundo(a)': 'f_2' },
            { 'familias_Terceiro(a)': 'f_3' },
            { 'familias_Quarto(a)': 'f_4' },
            { 'familias_Quinto(a)': 'f_5' },
            { 'familias_Sexto(a)': 'f_6' },
            { 'familias_Setimo(a)': 'f_7' },
            { 'familias_Oitavo(a)': 'f_8' },
            { 'familias_Nono(a)': 'f_9' },
            { 'familias_Curso_nao_seriado(a)': 'f_10' },
            { 'familias_sem_dados': 'y' },
            { 'familias_total': 'x' }]
    }

    if (coluna === 'pcod_agricultura_trab_memb') {
        entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }


    if (coluna === 'pcod_principal_trab_memb') {
        entre = [
            { 'Trabalhador_por_conta_propria_(bico,_autonomo)': 'p_1' },
            { 'Trabalhador_temporario_em_area_rural': 'p_2' },
            { 'Empregado_sem_carteira_de_trabalho_assinada': 'p_3' },
            { 'Empregado_com_carteira_de_trabalho_assinada': 'p_4' },
            { 'Trabalhador_domestico_sem_carteira_de_trabalho_assinada': 'p_5' },
            { 'Trab_domestico_com_cart_de_trab_assinada': 'p_6' },
            { 'Trabalhador_não_remunerado': 'p_7' },
            { 'Militar_ou_servidor_publico': 'p_8' },
            { 'Empregador': 'p_9' },
            { 'Estagiario': 'p_10' },
            { 'Aprendiz': 'p_11' },
            { 'sem_dados': 'v' },
            { 'pessoas_total': 'w' },
            { 'familia_Trabalhador_por_conta_propria_(bico,_autonomo)': 'f_1' },
            { 'familia_Trabalhador_temporario_em_area_rural': 'f_2' },
            { 'familia_Empregado_sem_carteira_de_trabalho_assinada': 'f_3' },
            { 'familia_Empregado_com_carteira_de_trabalho_assinada': 'f_4' },
            { 'familia_Trabalhador_domestico_sem_carteira_de_trabalho_assinada': 'f_5' },
            { 'familia_Trab_domestico_com_cart_de_trab_assinada': 'f_6' },
            { 'familia_Trabalhador_não_remunerado': 'f_7' },
            { 'familia_Militar_ou_servidor_publico': 'f_8' },
            { 'familia_Empregador': 'f_9' },
            { 'familia_Estagiario': 'f_10' },
            { 'familia_Aprendiz': 'f_11' },
            { 'familias_sem_dados': 'y' },
            { 'familias_total': 'x' }]
    }

    if (coluna === 'pcod_afastado_trab_memb') {
        entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }

    if (coluna === 'pcod_trabalho_12_meses_memb') {
        entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_2' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_2' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }

    if (coluna === 'dind_parc_mds_fam') {
        entre = [
            { 'Cigano(a)': 'p_101' },
            { 'Extrativista': 'p_201' },
            { 'Pescador_artesanal': 'p_202' },
            { 'Comunidade_de_Terreiro': 'p_203' },
            { 'Ribeirinho(a)': 'p_204' },
            { 'Agricultor_Familiar': 'p_205' },
            { 'Assentado(a)_da_Reforma_Agraria': 'p_301' },
            { 'Beneficiario(a)_do_Credito_Fundiario': 'p_302' },
            { 'Acampado(a)': 'p_303' },
            { 'Atingida_por_Empreendimentos_de_Infraestrutura': 'p_304' },
            { 'Preso(a)_do_Sistema_Carcerario': 'p_305' },
            { 'Catador(a)_de_Material_Reciclavel': 'p_306' },
            { 'Nenhum(a)': 'p_0' },
            { 'sem_dados': 'v' },
            { 'pessoas_total': 'w' },
            { 'Familia_Cigana': 'p_101' },
            { 'Familia_Extrativista': 'f_201' },
            { 'Familia_Pescadores_artesanais': 'f_202' },
            { 'Familia_Pertencente_a_Comunidade_de_Terreiro': 'f_203' },
            { 'Familia_Ribeirinha': 'f_204' },
            { 'Familia_Agricultores_Familiar': 'f_205' },
            { 'Familia_Assentada_da_Reforma_Agraria': 'f_301' },
            { 'Familia_Beneficiaria_do_Programa_Nacional_do_Credito_Fundiario': 'f_302' },
            { 'Familia_Acampada': 'f_303' },
            { 'Familia_Atingida_por_Empreendimentos_de_Infraestrutura': 'f_304' },
            { 'Familia_de_Preso_do_Sistema_Carcerario': 'f_305' },
            { 'Familia_Catadores_de_Material_Reciclavel': 'f_306' },
            { 'Nenhuma': 'f_0' },
            { 'familias_sem_dados': 'y' },
            { 'familias_total': 'x' }]
    }

    if (coluna === 'pmarc_sit_rua') {
        entre = [{ 'Sim': 'p_1' }, { 'Não': 'p_0' }, { 'sem_dados': 'v' }, { 'pessoas_total': 'w' },
        { 'familias_Sim': 'f_1' }, { 'familias_Não': 'f_0' }, { 'familias_sem_dados': 'y' }, { 'familias_total': 'x' }]
    }
    return entre
}
module.exports = objetoRetornado;